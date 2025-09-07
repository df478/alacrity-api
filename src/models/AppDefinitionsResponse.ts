import { IAppDef } from './AppDefinition'

export default interface AppDefinitionsResponse {
    appDefinitions: IAppDef[]
    rootDomain: string
    alacranSubDomain: string
    defaultNginxConfig: string
}
