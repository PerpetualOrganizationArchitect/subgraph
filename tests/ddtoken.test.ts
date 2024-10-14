import {
    Address,
    BigInt,
    Bytes,
    ethereum,
    store,
  } from '@graphprotocol/graph-ts'
  import {
    beforeEach,
    describe,
    test,
    assert,
    afterEach,
    clearStore,
    log
  } from 'matchstick-as/assembly/index'
  import { handleTokenMint } from '../src/mappings/ddToken/ddTokenMapping'
  import { DDToken, User, PerpetualOrganization, NFTMembership, infoIPFS, PTToken, Treasury, TaskManager, PTVoting, DDVoting, HybridVoting, ElectionContract, EducationHubContract, QuickJoinContract, Registry } from './../generated/schema'
  import { Mint } from './../generated/templates/DirectDemocracyToken/DirectDemocracyToken'
  import { newMockEvent } from 'matchstick-as/assembly/index'
  
  class MintFixture {
    to: Address
    amount: BigInt
    token: Address
  }
  
  const MINT_FIXTURE: MintFixture = {
    to: Address.fromString('0x0000000000000000000000000000000000000002'),
    amount: BigInt.fromString('1000'),
    token: Address.fromString('0x0000000000000000000000000000000000000001'),
  }
  
  function createMintEvent(
    to: Address,
    amount: BigInt,
    tokenAddress: Address,
  ): Mint {
    let mockEvent = newMockEvent()
    mockEvent.address = tokenAddress
  
    // Set required properties for the event
    mockEvent.transaction.hash = Bytes.fromHexString(
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    ) as Bytes
    mockEvent.logIndex = BigInt.fromI32(0)
    mockEvent.transactionLogIndex = BigInt.fromI32(0)
    mockEvent.block.number = BigInt.fromI32(1)
    mockEvent.block.timestamp = BigInt.fromI32(1)
    mockEvent.receipt = mockEvent.receipt
    // Initialize receipt properties if necessary
  
    let mintEvent = new Mint(
      mockEvent.address,
      mockEvent.logIndex,
      mockEvent.transactionLogIndex,
      mockEvent.logType,
      mockEvent.block,
      mockEvent.transaction,
      new Array<ethereum.EventParam>(),
      mockEvent.receipt, // Added the receipt parameter here
    )
  
    mintEvent.parameters.push(
      new ethereum.EventParam('to', ethereum.Value.fromAddress(to)),
    )
    mintEvent.parameters.push(
      new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(amount)),
    )
  
    return mintEvent
  }
  
  describe('handleTokenMint', () => {
    beforeEach(() => {
      clearStore()
  
      // Create infoIPFS entity (required by PerpetualOrganization)
      let aboutInfo = new infoIPFS('aboutInfo-1')
      aboutInfo.description = 'This is a test organization.'
      aboutInfo.save()
  
      // Create NFTMembership entity (required by PerpetualOrganization)
      let nftMembership = new NFTMembership('0x0000000000000000000000000000000000000010')
      nftMembership.contractAddress = Address.fromString('0x0000000000000000000000000000000000000010')
      nftMembership.POname = 'MyPO'
      nftMembership.memberTypeNames = ['Member']
      nftMembership.executiveRoles = ['Admin']
      nftMembership.defaultImageURL = 'https://example.com/default.png'
      nftMembership.save()
  
      // Create DDToken entity (required by PerpetualOrganization)
      let ddToken = new DDToken(MINT_FIXTURE.token.toHex())
      ddToken.tokenAddress = MINT_FIXTURE.token
      ddToken.name = 'Test Token'
      ddToken.symbol = 'TTK'
      ddToken.POname = 'MyPO'
      ddToken.save()
  
      // Create PTToken entity (required by PerpetualOrganization)
      let ptToken = new PTToken('0x0000000000000000000000000000000000000020')
      ptToken.tokenAddress = Address.fromString('0x0000000000000000000000000000000000000020')
      ptToken.name = 'Participation Token'
      ptToken.symbol = 'PTK'
      ptToken.POname = 'MyPO'
      ptToken.supply = BigInt.fromI32(0)
      ptToken.save()
  
      // Create Treasury entity (with contract address)
      let treasury = new Treasury('0x0000000000000000000000000000000000000030')
      treasury.POname = 'MyPO'
      treasury.treasuryAddress = Address.fromString('0x0000000000000000000000000000000000000030')
      treasury.votingContract = Address.fromString('0x0000000000000000000000000000000000000031')
      treasury.save()
  
      // Create TaskManager entity (with contract address)
      let taskManager = new TaskManager('0x0000000000000000000000000000000000000040')
      taskManager.POname = 'MyPO'
      taskManager.contract ='0x0000000000000000000000000000000000000040'
      taskManager.activeTaskAmount = BigInt.fromI32(0)
      taskManager.completedTaskAmount = BigInt.fromI32(0)
      taskManager.save()
  
      // Create Voting entities (PTVoting, DDVoting, HybridVoting with contract addresses)
      let ptVoting = new PTVoting('0x0000000000000000000000000000000000000050')
      ptVoting.contract = '0x0000000000000000000000000000000000000050'
      ptVoting.POname = 'MyPO'
      ptVoting.quorum = BigInt.fromI32(0)
      ptVoting.save()
  
      let ddVoting = new DDVoting('0x0000000000000000000000000000000000000060')
      ddVoting.contract = '0x0000000000000000000000000000000000000060'
      ddVoting.POname = 'MyPO'
      ddVoting.quorum = BigInt.fromI32(0)
      ddVoting.save()
  
      let hybridVoting = new HybridVoting('0x0000000000000000000000000000000000000070')
      hybridVoting.contract = '0x0000000000000000000000000000000000000070'
      hybridVoting.POname = 'MyPO'
      hybridVoting.percentDD = BigInt.fromI32(50)
      hybridVoting.percentPT = BigInt.fromI32(50)
      hybridVoting.quorum = BigInt.fromI32(0)
      hybridVoting.save()
  
      // Create ElectionContract entity (with contract address)
      let electionContract = new ElectionContract('0x0000000000000000000000000000000000000080')
      electionContract.contractAddress = Address.fromString('0x0000000000000000000000000000000000000080')
      electionContract.POname = 'MyPO'
      electionContract.votingContractAddress = Address.fromString('0x0000000000000000000000000000000000000081')
      electionContract.save()
  
      // Create EducationHubContract entity (with contract address)
      let educationHub = new EducationHubContract('0x0000000000000000000000000000000000000090')
      educationHub.POname = 'MyPO'
      educationHub.contractAddress = Address.fromString('0x0000000000000000000000000000000000000090')
      educationHub.save()
  
      // Create QuickJoinContract entity (with contract address)
      let quickJoin = new QuickJoinContract('0x00000000000000000000000000000000000000A0')
      quickJoin.POname = 'MyPO'
      quickJoin.save()
  
      // Create Registry entity (with contract address)
      let registry = new Registry('0x00000000000000000000000000000000000000B0')
      registry.contract = '0x00000000000000000000000000000000000000B0'
      registry.POname = 'MyPO'
      registry.votingContract = Address.fromString('0x00000000000000000000000000000000000000B1')
      registry.logoHash = 'someLogoHash'
      registry.save()
  
      // Create PerpetualOrganization entity
      let organization = new PerpetualOrganization('0x00000000000000000000000000000000000000C0')
      organization.name = 'MyPO'
      organization.aboutInfo = aboutInfo.id
      organization.logoHash = 'someLogoHash'
      organization.NFTMembership = nftMembership.id
      organization.registry = registry.id
      organization.DirectDemocracyToken = ddToken.id
      organization.ParticipationToken = ptToken.id
      organization.Treasury = treasury.id
      organization.TaskManager = taskManager.id
      organization.ParticipationVoting = ptVoting.id
      organization.DirectDemocracyVoting = ddVoting.id
      organization.HybridVoting = hybridVoting.id
      organization.ElectionContract = electionContract.id
      organization.EducationHubContract = educationHub.id
      organization.QuickJoinContract = quickJoin.id
      organization.totalMembers = BigInt.fromI32(1)
      organization.save()
  
      // Create User entity
      let userId = organization.name + '-' + MINT_FIXTURE.to.toHex()
      let user = new User(userId)
      user.organization = organization.id
      user.address = MINT_FIXTURE.to
      user.ddTokenBalance = BigInt.fromI32(0)
      user.ptTokenBalance = BigInt.fromI32(0)
      user.memberType = null // Assuming the user hasn't been assigned a member type yet
      user.Account = null // Assuming no account linked yet
      user.totalVotes = BigInt.fromI32(0)
      user.dateJoined = BigInt.fromI32(1)
      user.save()
  
      log.info('Initial state set up', [])
    })
  
    afterEach(() => {
        log.info('Clearing store', [])
      clearStore()
    })
  
    test('simple assertion test', () => {
      assert.assertTrue(true)
    })
  
    test('should create a DDTokenMintEvent and update User balance', () => {
      let mintEvent = createMintEvent(
        MINT_FIXTURE.to,
        MINT_FIXTURE.amount,
        MINT_FIXTURE.token,
      )
      handleTokenMint(mintEvent)
  
      // Assertions for DDTokenMintEvent
      let eventId =
        mintEvent.transaction.hash.toHex() +
        '-' +
        mintEvent.logIndex.toString()
      assert.fieldEquals(
        'DDTokenMintEvent',
        eventId,
        'to',
        MINT_FIXTURE.to.toHex(),
      )
      assert.fieldEquals(
        'DDTokenMintEvent',
        eventId,
        'token',
        MINT_FIXTURE.token.toHex(),
      )
      assert.fieldEquals(
        'DDTokenMintEvent',
        eventId,
        'amount',
        MINT_FIXTURE.amount.toString(),
      )
  
      // Assertions for User balance update
      let userId = 'MyPO-' + MINT_FIXTURE.to.toHex()
      assert.fieldEquals(
        'Uer',
        userId,
        'ddTokenBalance',
        MINT_FIXTURE.amount.toString(),
      )
        log.info('User balance updated', [])
    })
      
  })
  