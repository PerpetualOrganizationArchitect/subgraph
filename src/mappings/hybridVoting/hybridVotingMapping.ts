import { log} from "@graphprotocol/graph-ts"
import { BigInt } from "@graphprotocol/graph-ts"
import { NewProposal, Voted, PollOptionNames, WinnerAnnounced } from "../../../generated/templates/HybridVoting/HybridVoting"
import { HybridProposal, HybridPollOption,HybridVote, HybridVoting, User, HybridVoteWeight } from "../../../generated/schema"


export function handleNewProposal(event: NewProposal): void {
  log.info("Triggered handleNewProposal", []);

    let newProposal = new HybridProposal(event.params.proposalId.toString()+'-'+event.address.toHex());
    newProposal.name = event.params.name;
    let contract = HybridVoting.load(event.address.toHex());
    if (!contract) {
      log.error("Voting contract not found: {}", [event.address.toHex()]);
      return;
    }
    newProposal.creator = contract.POname + '-' + event.transaction.from.toHex();
    newProposal.description = event.params.description;
    newProposal.creationTimestamp = event.params.creationTimestamp;
    newProposal.timeInMinutes = event.params.timeInMinutes;
    newProposal.transferTriggerOptionIndex = event.params.transferTriggerOptionIndex;
    newProposal.transferAmount = event.params.transferAmount;
    newProposal.transferRecipient = event.params.transferRecipient;
    newProposal.transferEnabled = event.params.transferEnabled;
    newProposal.experationTimestamp = event.params.creationTimestamp.plus(event.params.timeInMinutes.times(BigInt.fromI32(60)));
    newProposal.totalVotes = BigInt.fromI32(0);
    newProposal.totalVotesDD = BigInt.fromI32(0);
    newProposal.totalVotesPT = BigInt.fromI32(0);
    newProposal.voting = event.address.toHex();
    newProposal.transferAddress = event.params.transferToken;
    newProposal.validWinner = false;
    newProposal.save();
}

// needs work
export function handleVoted(event: Voted): void {
  log.info("Triggered handleVoted for proposalId {}", [event.params.proposalId.toString()]);

  let proposalId = event.params.proposalId.toString() + '-' + event.address.toHex();
  let proposal = HybridProposal.load(proposalId);
  if (!proposal) {
    log.error("Proposal not found: {}", [proposalId]);
    return;
  }

  let voteId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let vote = new HybridVote(voteId);
  vote.proposal = proposalId;
  let contract = HybridVoting.load(event.address.toHex());

  if (!contract) {
    log.error("Voting contract not found: {}", [event.address.toHex()]);
    return;
  }

  vote.voter = contract.POname + '-' + event.params.voter.toHex();

  let votePT = event.params.voteWeightPT;  // Participation token weight
  let voteDD = BigInt.fromI32(100);  // Direct Democracy tokens (fixed at 100)

  // Total Votes count
  proposal.totalVotes = proposal.totalVotes.plus(BigInt.fromI32(1));
  vote.save();

  let user = User.load(contract.POname + '-' + event.params.voter.toHex());
  if (user != null) {
    user.totalVotes = user.totalVotes.plus(BigInt.fromI32(1));
    user.save();
  }

  // Process each vote option
  for (let i = 0; i < event.params.optionIndices.length; i++) {
    let optionIndex = event.params.optionIndices[i];
    let weight = event.params.weights[i];

    // Vote weights for this option
    let voteWeightId = voteId + "-" + optionIndex.toString();
    let voteWeight = new HybridVoteWeight(voteWeightId);
    voteWeight.vote = voteId;
    voteWeight.user = contract.POname + '-' + event.params.voter.toHex();
    voteWeight.optionIndex = optionIndex;

    // Weighted values for PT and DD
    let weightedPT = weight.times(votePT).div(BigInt.fromI32(100));
    let weightedDD = weight.times(voteDD).div(BigInt.fromI32(100));

    // Update the option's total PT and DD votes
    let optionId = proposalId + "-" + optionIndex.toString();
    let option = HybridPollOption.load(optionId);
    if (!option) {
      log.error("Option not found: {}", [optionId]);
      return;
    }

    // Keep track of total PT and DD votes for this option
    option.optionVotesPT = option.optionVotesPT.plus(weightedPT);
    option.optionVotesDD = option.optionVotesDD.plus(weightedDD);

    // Update proposal total votes
    proposal.totalVotesPT = proposal.totalVotesPT.plus(weightedPT);
    proposal.totalVotesDD = proposal.totalVotesDD.plus(weightedDD);
    proposal.save();

    option.save();
  }

  // Now recalculate percentages for all options in the proposal
  let totalPT = proposal.totalVotesPT;
  let totalDD = proposal.totalVotesDD;

  // Fetch all options for the proposal by iterating through them manually
  for (let i = 0; i < event.params.optionIndices.length; i++) {
    let optionIndex = event.params.optionIndices[i];
    let optionId = proposalId + "-" + optionIndex.toString();
    let option = HybridPollOption.load(optionId);

    if (!option) {
      log.error("Option not found during recalculation: {}", [optionId]);
      return;
    }

    // Ensure total PT and DD are not zero to prevent division by zero
    let percentPTVotes = BigInt.fromI32(0);
    let percentDDVotes = BigInt.fromI32(0);

    if (totalPT.gt(BigInt.fromI32(0))) {
      percentPTVotes = option.optionVotesPT.times(BigInt.fromI32(100)).div(totalPT);
    }

    if (totalDD.gt(BigInt.fromI32(0))) {
      percentDDVotes = option.optionVotesDD.times(BigInt.fromI32(100)).div(totalDD);
    }

    // Calculate the final weighted percentage of this option based on percentDD and percentPT from the contract
    let percentPT = percentPTVotes.times(contract.percentPT).div(BigInt.fromI32(100));
    let percentDD = percentDDVotes.times(contract.percentDD).div(BigInt.fromI32(100));

    // Set the option's current percentage based on the weighted sum of PT and DD
    option.currentPercentage = percentPT.plus(percentDD);
    option.save();
  }
}



  
  export function handlePollOptionNames(event: PollOptionNames): void {
    log.info("Triggered handlePollOptionNames for proposalId {}", [event.params.proposalId.toString()]);
  
    let proposalId = event.params.proposalId.toString()+'-'+event.address.toHex();
    let optionId = proposalId + "-" + event.params.optionIndex.toString();
    let option = new HybridPollOption(optionId);
    option.proposal = proposalId;
    option.name = event.params.name;
    option.optionVotesPT = BigInt.fromI32(0);
    option.optionVotesDD = BigInt.fromI32(0);
    option.currentPercentage = BigInt.fromI32(0);
    option.save();
  }
  
  export function handleWinnerAnnounced(event: WinnerAnnounced): void {
    log.info("Triggered handleWinnerAnnounced for proposalId {}", [event.params.proposalId.toString()]);
  
    let proposalId = event.params.proposalId.toString()+'-'+event.address.toHex();
    let proposal = HybridProposal.load(proposalId);
    if (!proposal) {
      log.error("Proposal not found: {}", [proposalId]);
      return;
    }
  
    proposal.winningOptionIndex = event.params.winningOptionIndex;
    proposal.validWinner = event.params.hasValidWinner;
    proposal.save();
  }
  