import { IAppDef } from '../models/AppDefinition'
import AppDefinitionsResponse from '../models/AppDefinitionsResponse'
import AppDeleteResponse from '../models/AppDeleteResponse'
import { IAutomatedCleanupConfigs } from '../models/AutomatedCleanupConfigs'
import { BuildLogsResponse } from '../models/BuildLogsResponse'
import AlaCrityTheme from '../models/AlaCrityTheme'
import AlacranInfo from '../models/AlacranInfo'
import { GoAccessInfo } from '../models/GoAccessInfo'
import GoAccessReportResponse from '../models/GoAccessReportResponse'
import { IAlacranDefinition } from '../models/IAlacranDefinition'
import IGoAccessInfo from '../models/IGoAccessInfo'
import { IRegistryInfo } from '../models/IRegistryInfo'
import LoadBalancerInfo from '../models/LoadBalancerInfo'
import LogsResponse from '../models/LogsResponse'
import { NetDataInfo } from '../models/NetDataInfo'
import NginxConfig from '../models/NginxConfig'
import { ProjectDefinition } from '../models/ProjectDefinition'
import ProjectsResponse from '../models/ProjectsResponse'
import RegistriesResponse from '../models/RegistriesResponse'
import { ServerDockerInfo } from '../models/ServerDockerInfo'
import UnusedImagesResponse from '../models/UnusedImagesResponse'
import HttpClient from './HttpClient'

export type AuthenticationContent = {
    password: string
}

export interface AuthenticationProvider {
    onAuthTokenRequested(): Promise<string>
    onCredentialsRequested(): Promise<AuthenticationContent>
    onAuthTokenUpdated(authToken: string): void
}

export class SimpleAuthenticationProvider implements AuthenticationProvider {
    private authToken: string = ''

    constructor(
        private onCredRequestedImpl: () => Promise<AuthenticationContent>
    ) {}

    onAuthTokenRequested(): Promise<string> {
        return Promise.resolve(this.authToken)
    }

    onCredentialsRequested(): Promise<AuthenticationContent> {
        return this.onCredRequestedImpl()
    }

    onAuthTokenUpdated(newAuthToken: string) {
        this.authToken = newAuthToken
    }
}

export default class ApiManager {
    private http: HttpClient

    constructor(
        baseDomain: string,
        private authProvider: AuthenticationProvider
    ) {
        const self = this
        const URL = baseDomain + '/api/v1'
        this.http = new HttpClient(
            URL,
            () => {
                return authProvider.onAuthTokenRequested()
            },
            () => {
                return Promise.resolve() //
                    .then(() => {
                        return authProvider.onCredentialsRequested()
                    })
                    .then((authContent) => {
                        return self.login(
                            authContent.password
                        )
                    })
            }
        )
    }

    destroy() {
        this.http.destroy()
    }

    login(password: string): Promise<void> {
        const self = this
        const http = self.http

        return Promise.resolve() //
            .then((authContent) => {
                return Promise.resolve() //
                    .then(
                        http.fetch(http.POST, '/login', {
                            password: password,
                        })
                    )
            })
            .then(function (data) {
                return data.token
            })
            .then((authToken) => {
                self.authProvider.onAuthTokenUpdated(authToken)
            })
    }

    getAllThemes(): Promise<{ themes: AlaCrityTheme[] | undefined }> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/themes/all', {}))
    }

    getCurrentTheme(): Promise<{ theme: AlaCrityTheme }> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/theme/current', {}))
    }

    setCurrentTheme(themeName: string): Promise<{}> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/themes/setcurrent', {
                    themeName,
                })
            )
    }

    saveTheme(oldName: string, theme: AlaCrityTheme): Promise<{}> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/themes/update', {
                    oldName,
                    name: theme.name,
                    content: theme.content,
                })
            )
    }

    deleteTheme(themeName: string): Promise<{}> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/themes/delete', {
                    themeName,
                })
            )
    }

    getAlacranInfo(): Promise<AlacranInfo> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/info', {}))
    }

    updateRootDomain(rootDomain: string, force: boolean): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/changerootdomain', {
                    rootDomain,
                    force,
                })
            )
    }

    enableRootSsl(emailAddress: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/enablessl', {
                    emailAddress,
                })
            )
    }

    forceSsl(isEnabled: boolean): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.POST, '/user/system/forcessl', { isEnabled }))
    }

    getAllApps(): Promise<AppDefinitionsResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/apps/appDefinitions', {}))
    }

    getAllProjects(): Promise<ProjectsResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/projects', {}))
    }

    fetchBuildLogs(appName: string): Promise<BuildLogsResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, `/user/apps/appData/${appName}`, {}))
    }

    fetchAppLogsInHex(appName: string): Promise<LogsResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.GET,
                    `/user/apps/appData/${appName}/logs?encoding=hex`,
                    {}
                )
            )
    }

    uploadAppData(appName: string, file: File): Promise<void> {
        const http = this.http
        let formData = new FormData()
        formData.append('sourceFile', file)
        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    `/user/apps/appData/${appName}?detached=1`,
                    formData
                )
            )
    }

    registerProject(
        selectedProject: ProjectDefinition
    ): Promise<ProjectDefinition> {
        const http = this.http
        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/projects/register', {
                    ...selectedProject,
                })
            )
    }

    updateProject(project: ProjectDefinition): Promise<void> {
        const http = this.http
        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/projects/update', {
                    projectDefinition: project,
                })
            )
    }

    uploadAlacranDefinitionContent(
        appName: string,
        alacranDefinition: IAlacranDefinition,
        gitHash: string,
        detached: boolean
    ): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    `/user/apps/appData/${appName}${
                        detached ? '?detached=1' : ''
                    }`,
                    {
                        alacranDefinitionContent:
                            JSON.stringify(alacranDefinition),
                        gitHash,
                    }
                )
            )
    }

    updateConfigAndSave(
        appName: string,
        appDefinition: IAppDef
    ): Promise<void> {
        let instanceCount = appDefinition.instanceCount
        let alacranDefinitionRelativeFilePath =
            appDefinition.alacranDefinitionRelativeFilePath
        let envVars = appDefinition.envVars
        let notExposeAsWebApp = appDefinition.notExposeAsWebApp
        let forceSsl = appDefinition.forceSsl
        let websocketSupport = appDefinition.websocketSupport
        let volumes = appDefinition.volumes
        let ports = appDefinition.ports
        let nodeId = appDefinition.nodeId
        let appPushWebhook = appDefinition.appPushWebhook
        let customNginxConfig = appDefinition.customNginxConfig
        let preDeployFunction = appDefinition.preDeployFunction
        let serviceUpdateOverride = appDefinition.serviceUpdateOverride
        let containerHttpPort = appDefinition.containerHttpPort
        let description = appDefinition.description
        let httpAuth = appDefinition.httpAuth
        let appDeployTokenConfig = appDefinition.appDeployTokenConfig
        let tags = appDefinition.tags
        let redirectDomain = appDefinition.redirectDomain
        let projectId = appDefinition.projectId
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/apps/appDefinitions/update', {
                    appName: appName,
                    instanceCount: instanceCount,
                    alacranDefinitionRelativeFilePath:
                        alacranDefinitionRelativeFilePath,
                    notExposeAsWebApp: notExposeAsWebApp,
                    forceSsl: forceSsl,
                    websocketSupport: websocketSupport,
                    volumes: volumes,
                    ports: ports,
                    customNginxConfig: customNginxConfig,
                    appPushWebhook: appPushWebhook,
                    nodeId: nodeId,
                    preDeployFunction: preDeployFunction,
                    serviceUpdateOverride: serviceUpdateOverride,
                    containerHttpPort: containerHttpPort,
                    description: description,
                    httpAuth: httpAuth,
                    envVars: envVars,
                    appDeployTokenConfig: appDeployTokenConfig,
                    tags: tags,
                    redirectDomain: redirectDomain,
                    projectId: projectId,
                })
            )
    }

    renameApp(oldAppName: string, newAppName: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/apps/appDefinitions/rename', {
                    oldAppName,
                    newAppName,
                })
            )
    }

    registerNewApp(
        appName: string,
        projectId: string,
        hasPersistentData: boolean,
        detached: boolean
    ): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    `/user/apps/appDefinitions/register${
                        detached ? '?detached=1' : ''
                    }`,
                    {
                        appName,
                        projectId,
                        hasPersistentData,
                    }
                )
            )
    }

    deleteApp(
        appName: string | undefined,
        volumes: string[],
        appNames: string[] | undefined
    ): Promise<AppDeleteResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/apps/appDefinitions/delete', {
                    appName,
                    volumes,
                    appNames,
                })
            )
    }

    deleteProjects(projectIds: string[]): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/projects/delete', {
                    projectIds,
                })
            )
    }

    enableSslForBaseDomain(appName: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/apps/appDefinitions/enablebasedomainssl',
                    {
                        appName,
                    }
                )
            )
    }

    attachNewCustomDomainToApp(
        appName: string,
        customDomain: string
    ): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/apps/appDefinitions/customdomain',
                    {
                        appName,
                        customDomain,
                    }
                )
            )
    }

    enableSslForCustomDomain(
        appName: string,
        customDomain: string
    ): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/apps/appDefinitions/enablecustomdomainssl',
                    {
                        appName,
                        customDomain,
                    }
                )
            )
    }

    removeCustomDomain(appName: string, customDomain: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/apps/appDefinitions/removecustomdomain',
                    {
                        appName,
                        customDomain,
                    }
                )
            )
    }

    getLoadBalancerInfo(): Promise<LoadBalancerInfo> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/loadbalancerinfo', {}))
    }

    getNetDataInfo(): Promise<NetDataInfo> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/netdata', {}))
    }

    updateNetDataInfo(netDataInfo: NetDataInfo): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/netdata', { netDataInfo })
            )
    }

    getGoAccessInfo(): Promise<IGoAccessInfo> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/goaccess', {}))
    }

    updateGoAccessInfo(goAccessInfo: GoAccessInfo): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/goaccess', { goAccessInfo })
            )
    }
    getGoAccessReports(appName: string): Promise<GoAccessReportResponse[]> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.GET,
                    `/user/system/goaccess/${appName}/files`,
                    {}
                )
            )
    }

    getGoAccessReport(reportUrl: string): Promise<string> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, reportUrl, {}))
    }

    changePass(oldPassword: string, newPassword: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/changepassword', {
                    oldPassword,
                    newPassword,
                })
            )
    }

    createBackup(): Promise<{ downloadToken: string }> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/createbackup', {
                    postDownloadFileName: 'backup.tar',
                })
            )
    }

    getNginxConfig(): Promise<NginxConfig> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/nginxconfig', {}))
    }

    setNginxConfig(customBase: string, customAlacran: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/nginxconfig', {
                    baseConfig: { customValue: customBase },
                    alacranConfig: { customValue: customAlacran },
                })
            )
    }

    getUnusedImages(mostRecentLimit: number): Promise<UnusedImagesResponse> {
        const http = this.http
        return Promise.resolve() //
            .then(
                http.fetch(http.GET, '/user/apps/appDefinitions/unusedImages', {
                    mostRecentLimit: mostRecentLimit + '',
                })
            )
    }

    deleteImages(imageIds: string[]): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/apps/appDefinitions/deleteImages',
                    {
                        imageIds,
                    }
                )
            )
    }

    getDiskCleanUpSettings(): Promise<IAutomatedCleanupConfigs> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/diskcleanup', {}))
    }

    setDiskCleanUpSettings(
        mostRecentLimit: number,
        cronSchedule: string,
        timezone: string
    ): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/diskcleanup', {
                    mostRecentLimit,
                    cronSchedule,
                    timezone,
                })
            )
    }

    getDockerRegistries(): Promise<RegistriesResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/registries', {}))
    }

    enableSelfHostedDockerRegistry(): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/system/selfhostregistry/enableregistry',
                    {}
                )
            )
    }

    disableSelfHostedDockerRegistry(): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/system/selfhostregistry/disableregistry',
                    {}
                )
            )
    }

    addDockerRegistry(dockerRegistry: IRegistryInfo): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/registries/insert', {
                    ...dockerRegistry,
                })
            )
    }

    updateDockerRegistry(dockerRegistry: IRegistryInfo): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/registries/update', {
                    ...dockerRegistry,
                })
            )
    }

    deleteDockerRegistry(registryId: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/registries/delete', {
                    registryId,
                })
            )
    }

    setDefaultPushDockerRegistry(registryId: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/registries/setpush', {
                    registryId,
                })
            )
    }

    forceBuild(webhookPath: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.POST, webhookPath, {}))
    }

    getAllNodes(): Promise<{ nodes: ServerDockerInfo[] }> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/nodes', {}))
    }

    addDockerNode(
        nodeType: string,
        privateKey: string,
        remoteNodeIpAddress: string,
        sshPort: string,
        sshUser: string,
        alacranIpAddress: string
    ): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/nodes', {
                    nodeType,
                    privateKey,
                    remoteNodeIpAddress,
                    sshPort,
                    sshUser,
                    alacranIpAddress,
                })
            )
    }

    executeGenericApiCommand(
        verb: 'GET' | 'POST',
        endpoint: string,
        data: any
    ): Promise<any> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(verb, endpoint, data))
    }
}
