import Web3 from 'web3';
import { PrismaService } from './prisma.service';
import { PlayFabService } from './services/playfab/playfab.service';

export class Web3Service {
  private provider = new Web3.providers.HttpProvider(
    process.env.BSC_TEST_PROVIDER,
  );
  private web3 = new Web3(this.provider);

  constructor(
    private prismaService: PrismaService,
    private playFabService: PlayFabService,
  ) {}
}
