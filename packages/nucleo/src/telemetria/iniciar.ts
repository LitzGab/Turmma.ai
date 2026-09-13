import { metrics, type Meter } from '@opentelemetry/api'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { MeterProvider, PeriodicExportingMetricReader, type PushMetricExporter } from '@opentelemetry/sdk-metrics'
import { hostname } from 'node:os'
import { z } from 'zod'
import { validarAmbiente } from '../config/validar-config.js'
import { observarEventLoop } from './metricas.js'
import { temporalidadeDasMetricas } from './temporalidade.js'

/** Nome do medidor de todo processo. As métricas se distinguem pelo `service.name`, não pelo medidor. */
export const NOME_DO_MEDIDOR = 'educa'

/** Os processos que exportam métrica. Vira `service.name`, e o Prometheus o mostra no rótulo `job`. */
export type ServicoInstrumentado = 'api' | 'realtime' | 'despachante' | 'worker'

/** Prazo de cada exportação. Observabilidade fora não segura nada: a exportação desiste, e a seguinte tenta de novo. */
export const PRAZO_DA_EXPORTACAO_MS = 5_000

export interface ConfiguracaoTelemetria {
  /** Base do receptor OTLP/HTTP (o `observabilidade` do compose). As métricas vão para `/v1/metrics`. */
  readonly otlpUrl: string
  /** De quanto em quanto tempo o processo coleta e exporta. */
  readonly intervaloMs: number
}

const esquemaAmbienteTelemetria = z.object({
  TELEMETRIA_OTLP_URL: z.url({ protocol: /^https?$/ }),
  TELEMETRIA_INTERVALO_MS: z.coerce.number().int().min(1_000),
})

/** Destino e intervalo da exportação, do ambiente. Nenhum dos dois tem padrão escondido no código. */
export function lerConfiguracaoTelemetria(ambiente: Record<string, string | undefined>): ConfiguracaoTelemetria {
  const valores = validarAmbiente(esquemaAmbienteTelemetria, ambiente)
  return { otlpUrl: valores.TELEMETRIA_OTLP_URL.replace(/\/+$/, ''), intervaloMs: valores.TELEMETRIA_INTERVALO_MS }
}

/** O exportador OTLP com a temporalidade de `temporalidadeDasMetricas`, que a opção dele não permite escolher por instrumento. */
function comTemporalidade(exportador: PushMetricExporter): PushMetricExporter {
  return {
    export: (metricas, aoTerminar) => exportador.export(metricas, aoTerminar),
    forceFlush: () => exportador.forceFlush(),
    shutdown: () => exportador.shutdown(),
    selectAggregationTemporality: temporalidadeDasMetricas,
  }
}

export interface Telemetria {
  /** O medidor com que o processo cria as métricas dele. */
  readonly medidor: Meter
  /** Exporta o que falta e para. Não lança: observabilidade fora não atrasa o desligamento. */
  encerrar(): Promise<void>
}

/**
 * Liga o SDK de métricas do OpenTelemetry no processo, exportando OTLP/HTTP para a observabilidade
 * local a cada `intervaloMs` (Tech Spec, seção 5). Chamar antes de montar a aplicação: medidor pedido
 * à API global antes daqui seria um medidor vazio.
 *
 * O recurso só identifica o processo: `service.name` e `service.instance.id` (o nome do host, que no
 * container é o id dele). Nada de pessoa, nem de escola.
 *
 * Exportação que falha (observabilidade fora) não escreve no log nem derruba o processo: o erro vai ao
 * `diag` do OpenTelemetry, que fica desligado.
 */
export function iniciarTelemetria(servico: ServicoInstrumentado, config: ConfiguracaoTelemetria): Telemetria {
  const exportador = new OTLPMetricExporter({ url: `${config.otlpUrl}/v1/metrics`, timeoutMillis: PRAZO_DA_EXPORTACAO_MS })
  const provedor = new MeterProvider({
    resource: resourceFromAttributes({
      'service.namespace': 'educa',
      'service.name': servico,
      'service.instance.id': hostname(),
    }),
    readers: [
      new PeriodicExportingMetricReader({
        exporter: comTemporalidade(exportador),
        exportIntervalMillis: config.intervaloMs,
        exportTimeoutMillis: Math.min(config.intervaloMs, PRAZO_DA_EXPORTACAO_MS),
      }),
    ],
  })
  metrics.setGlobalMeterProvider(provedor)
  const medidor = provedor.getMeter(NOME_DO_MEDIDOR)
  observarEventLoop(medidor)
  return {
    medidor,
    encerrar: () => provedor.shutdown({ timeoutMillis: PRAZO_DA_EXPORTACAO_MS }).catch(() => undefined),
  }
}

/**
 * O medidor global. No processo que chamou `iniciarTelemetria`, é o que exporta; no teste que monta a
 * aplicação sem ela, é um medidor vazio, que não guarda nem envia nada.
 */
export function medidorGlobal(): Meter {
  return metrics.getMeter(NOME_DO_MEDIDOR)
}
