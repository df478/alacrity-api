import AlaCrityAPI, {
    AlaCrityModels,
    SimpleAuthenticationProvider,
} from './index'

const alacrity = new AlaCrityAPI(
    'https://alacran.server.demo.alacrity.com',
    new SimpleAuthenticationProvider(() => {
        return Promise.resolve({
            password: 'alacran42',
            otpToken: undefined,
        })
    })
)

console.log('===============================================')

Promise.resolve()
    .then(() => {
        return alacrity.getAllNodes()
    })
    .then((response) => {
        console.log(
            '=============================================== getAllNodes:'
        )

        console.log(response)
        return alacrity.getDockerRegistries()
    })
    .then((response) => {
        console.log(
            '=============================================== getDockerRegistries:'
        )
        console.log(response)
        return alacrity.executeGenericApiCommand('GET', '/user/registries', {})
    })
    .then((response) => {
        console.log(
            '=============================================== getDockerRegistries:'
        )
        console.log(response)
    })
    .catch((error) => {
        console.log(error)
    })
