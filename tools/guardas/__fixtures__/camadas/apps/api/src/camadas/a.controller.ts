import { ARepository } from './a.repository.js'
export class AController { constructor(readonly r = new ARepository()) {} }
