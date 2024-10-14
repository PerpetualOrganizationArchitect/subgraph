import { Address, BigInt, ethereum, store } from '@graphprotocol/graph-ts'
import { beforeAll, describe, test, assert } from 'matchstick-as/assembly/index'
import { handleTokenMint } from '../src/mappings/ddToken/ddTokenMapping'
import { DDToken, User } from './../generated/schema'
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

function createMintEvent(to: Address, amount: BigInt, tokenAddress: Address): Mint {
  let mockEvent = newMockEvent()
  let mintEvent = mockEvent as Mint
  mintEvent.parameters = new Array()

  mintEvent.parameters.push(new ethereum.EventParam("to", ethereum.Value.fromAddress(to)))
  mintEvent.parameters.push(new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount)))
  mintEvent.address = tokenAddress

  return mintEvent
}

describe('handleTokenMint', () => {

//   beforeAll(() => {
//     // Set up initial token and user
//     let token = new DDToken(MINT_FIXTURE.token.toHex())
//     token.POname = "MyPO"
//     token.save()

//     let user = new User(token.POname + '-' + MINT_FIXTURE.to.toHex())
//     user.ddTokenBalance = BigInt.fromI32(0)
//     user.save()
//   })

  test('simple assertion test', () => {
    assert.assertTrue(true)
  })

  test('should create a DDTokenMintEvent and update User balance', () => {
    let mintEvent = createMintEvent(MINT_FIXTURE.to, MINT_FIXTURE.amount, MINT_FIXTURE.token)
    handleTokenMint(mintEvent)

    // Assertions for DDTokenMintEvent
    let eventId = mintEvent.transaction.hash.toHex() + "-" + mintEvent.logIndex.toString()
    assert.fieldEquals('DDTokenMintEvent', eventId, 'to', MINT_FIXTURE.to.toHex())
    assert.fieldEquals('DDTokenMintEvent', eventId, 'token', MINT_FIXTURE.token.toHex())
    assert.fieldEquals('DDTokenMintEvent', eventId, 'amount', MINT_FIXTURE.amount.toString())

    // Assertions for User balance update
    let userId = "MyPO-" + MINT_FIXTURE.to.toHex()
    assert.fieldEquals('User', userId, 'ddTokenBalance', MINT_FIXTURE.amount.toString())
  })

  test('should log an error if DDToken is not found', () => {
    // Remove the DDToken so it can't be found
    let tokenId = MINT_FIXTURE.token.toHex()
    store.remove('DDToken', tokenId)

    let mintEvent = createMintEvent(MINT_FIXTURE.to, MINT_FIXTURE.amount, MINT_FIXTURE.token)
    handleTokenMint(mintEvent)

    // Assert no DDTokenMintEvent was created
    let eventId = mintEvent.transaction.hash.toHex() + "-" + mintEvent.logIndex.toString()
    assert.notInStore('DDTokenMintEvent', eventId)

    // Assert User's ddTokenBalance remains unchanged
    let userId = "MyPO-" + MINT_FIXTURE.to.toHex()
    assert.fieldEquals('User', userId, 'ddTokenBalance', '0')
  })
})
