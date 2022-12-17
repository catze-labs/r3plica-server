# r3plica Backend Repository

## Introduction

This repository is `r3plica` backend that participated in `BNB Chain innovation hackathon 2022`

Our backend server implemented based on [`Nest`](https://github.com/nestjs/nest) & [`Prisma ORM`](https://www.prisma.io).  
Also, for interact with block-chain, We use `web3.js` & `@ethersproject/wallet` library.

## Tech Stack

### Language stack

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?&style=for-the-badge&logo=TypeScript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-f7df12.svg?&style=for-the-badge&logo=JavaScript&logoColor=black)

### Frameworks

![NestJS](https://img.shields.io/badge/NestJS-E0234E.svg?&style=for-the-badge&logo=NestJS&logoColor=white)

### Database

![MySQL](https://img.shields.io/badge/MySQL-4479A1.svg?&style=for-the-badge&logo=MySQL&logoColor=white)
![PrismaORM](https://img.shields.io/badge/Prisma-2D3748.svg?&style=for-the-badge&logo=Prisma&logoColor=white)

### Core Libraries

![Web3.js](https://img.shields.io/badge/Web3.js-F16822.svg?&style=for-the-badge&logo=Web3.js&logoColor=white)

<br/>

## Installation

```bash
# Install dependencies
$ yarn
```

## Running the app

Before running server, You need `.env` file in root directory.  
Please make `.env` file.  
<br/>

`.env` file example

```
PORT=

ENVIRONMENT=
DATABASE_URL=
PLAY_FAB_X_SECRET_KEY=
PLAY_FAB_TITLE_ID=
PLAY_FAB_HOST=

BSC_TEST_PROVIDER=
BSC_PROVIDER=
BSCAN_API_KEY=
```

<br/>
Running commands:

```bash
# DB Setting
# Before run this command, You have to fill .env file first.
yarn db-setup


# Running server command options
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

<br/>

If you run server successfully,
You can see Swagger API document page in [http://localhost:8081/docs](http://localhost:8081/docs)

## Support

This repository is part of r3plica project SDK.  
Another repository link down below;

- [Frontend(NextJS)](https://github.com/catze-labs/r3plica-web)
- [Unity](https://github.com/catze-labs/r3plica-unity)
- [PlayFab CloudScript (JS ES6)](https://github.com/root-catze/r3plica-playfab)

## Stay in touch

- FE developer - [Aiden](https://www.twitter.com/aiiiden0)
- BE developer - [Phantola](https://www.twitter.com/phantola_catze)
- SC developer - [EK](https://www.twitter.com/JustDoEK)
- Unity developer - [Thon](thon@catze.xyz)
- Dev-ops - [Philip](https://www.twitter.com/mg_nomad)

## License

Nest is [MIT licensed](LICENSE).
