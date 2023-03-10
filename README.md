![image](https://user-images.githubusercontent.com/65929678/210930652-7847adbb-aa5d-4407-a111-6b43f568742e.png)

# r3plica-server

## Introduction

`r3plica` is a project born from [`Coinbase Hackathon`](https://www.XDCchain.org/en/kr-hackathon), and this repository is the back-end of `r3plica` project.

Our server implemented based on [`Nest`](https://github.com/nestjs/nest) & [`Prisma ORM`](https://www.prisma.io).  
For interacting with blockchain, we use `web3.js` & `@ethersproject/wallet` library.

## Tech Stack

### Language

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?&style=for-the-badge&logo=TypeScript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-f7df12.svg?&style=for-the-badge&logo=JavaScript&logoColor=black)

### Framework

![NestJS](https://img.shields.io/badge/NestJS-E0234E.svg?&style=for-the-badge&logo=NestJS&logoColor=white)

### Database & ORM

![MySQL](https://img.shields.io/badge/MySQL-4479A1.svg?&style=for-the-badge&logo=MySQL&logoColor=white)
![PrismaORM](https://img.shields.io/badge/Prisma-2D3748.svg?&style=for-the-badge&logo=Prisma&logoColor=white)

### Core Library

![Web3.js](https://img.shields.io/badge/Web3.js-F16822.svg?&style=for-the-badge&logo=Web3.js&logoColor=white)

<br/>

## Installation

```bash
# Install dependencies
$ yarn
```

## How to run

Before running server, you need `.env` file in root directory.  
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

APOTHEM_PROVIDER=
SLACK_WEBHOOK_URL=
```

<br/>
Running commands:

```bash
# DB Setting
# Before run this command, you have to fill .env file first.
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
you can see Swagger API document in [http://localhost:8081/docs](http://localhost:8081/docs)

<img width="734" alt="Screen Shot 2022-12-19 at 6 40 39" src="https://user-images.githubusercontent.com/14136835/208321065-e914cb92-93f4-4716-96d2-4bd6ff4737a3.png">

## Support

This repository a is part of r3plica project SDK.  
Another repository links are down below;

- [r3plica-web: Frontend(NextJS)](https://github.com/catze-labs/r3plica-web)
- [r3plica-unity: Unity](https://github.com/catze-labs/r3plica-unity-public)
- [r3plica-playfab: PlayFab CloudScript (JS ES6)](https://github.com/root-catze/r3plica-playfab)

## Contact

- FE developer - Aiden [twitter](https://www.twitter.com/aiiiden0)
- BE developer - Phantola [twitter](https://www.twitter.com/phantola_catze)
- SC developer - EK [twitter](https://www.twitter.com/JustDoEK)
- Unity developer - Thon [email](mailto:thon@catze.xyz)
- Dev-ops - Philip [twitter](https://www.twitter.com/mg_nomad)

## License

[MIT licensed](LICENSE)
