import { BigInt, log } from "@graphprotocol/graph-ts"
import { mintedNFT as MintEvent, membershipTypeChanged } from "../../../generated/templates/NFTMembership/NFTMembership"
import {NFTMintEvent,NFTChangeTypeEvent, User, NFTMembership, PerpetualOrganization } from "../../../generated/schema"
import { dataSource } from '@graphprotocol/graph-ts'


export function handleMintedNFT(event: MintEvent): void {
  log.info("Triggered handleMintedNFT", []);
  let entity = new NFTMintEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString());


  entity.memberTypeName = event.params.memberTypeName;
  entity.recipient = event.params.recipient;
  entity.tokenURI = event.params.tokenURI;
  entity.membership=event.address.toHex();
  entity.save();

  let nft = NFTMembership.load(event.address.toHex());


  if (nft == null) {
    log.error("NFTMembership not found: {}", [event.address.toHex()]);
    return;
  }

  let po = PerpetualOrganization.load(nft.POname);
  if (po == null) {
    log.error("PerpetualOrganization not found: {}", [nft.POname]);
    return;
  }
  
  // Check if user already exists before creating a new one
  let userId = nft.POname+'-'+event.params.recipient.toHex();
  let user = User.load(userId);
  
  if (user != null) {
    // User already exists, just update the memberType without resetting stats
    log.info("User already exists, updating memberType: {}", [userId]);
    user.memberType = nft.contractAddress.toHex() + "-" + event.params.memberTypeName;
    user.save();
  } else {
    // This is a new user, create with all required fields and increment member count
    log.info("Creating new user: {}", [userId]);
    user = new User(userId);
    user.address = event.params.recipient;
    user.organization = nft.POname;
    user.ddTokenBalance = BigInt.fromI32(0);
    user.ptTokenBalance = BigInt.fromI32(0);
    user.memberType = nft.contractAddress.toHex() + "-" + event.params.memberTypeName;
    user.Account = event.params.recipient.toHex();
    user.totalVotes = BigInt.fromI32(0);
    user.dateJoined = event.block.timestamp;
    user.save();
    
    // Only increment total members for new users
    po.totalMembers = po.totalMembers.plus(BigInt.fromI32(1));
    po.save();
  }
}

export function handleMembershipTypeChanged(event: membershipTypeChanged): void {
  log.info("Triggered handleMembershipTypeChanged", []);
  let entity = new NFTChangeTypeEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  entity.membership = event.address.toHex();
  entity.user = event.params.user;
  entity.newMemberType = event.params.newMemberType;
  entity.save();

  

  let nft = NFTMembership.load(event.address.toHex());


  if (nft == null) {
    log.error("NFTMembership not found: {}", [event.address.toHex()]);
    return;
  }
  let user = User.load(nft.POname+'-'+event.params.user.toHex());

  if (user != null && nft != null) {
    user.memberType = nft.contractAddress.toHex() + "-" + event.params.newMemberType;
    user.save();
  }
}

