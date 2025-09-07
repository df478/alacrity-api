https://github.com/df478/alacrity-api

# Official AlaCrity API SDK (TypeScript)

A simple, typed Typescript SDK for the AlaCrity API.

EXPERIMENTAL - backward compatibility is not guaranteed.

## Install

```
npm install alacrity-api
```

## Usage

```ts
import AlaCrityAPI, { AlaCrityModels } from 'alacrity-api'

const alacrity = new AlaCrityAPI(
    'https://alacran.server.demo.alacrity.com',
    new SimpleAuthenticationProvider(() => {
        return Promise.resolve({
            password: 'alacran42',
            otpToken: undefined,
        })
    })
)

alacrity
    .getAllNodes()
    .then((response) => {
        console.log(response)
    })
    .catch((error) => {
        console.log(error)
    })
```

---

## **How to Run Locally**

1. `npm install`
2. `npm run dev` _(after putting your own password/URL!)_
