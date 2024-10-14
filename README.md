# Poa Subgraph

This is the subgraph for Poa (Perpetual Organization Architect), a no-code DAO builder for community-owned organizations. The subgraph indexes relevant events and data from the Poa smart contracts to make it easily queryable via The Graph.

## Getting Started

### Prerequisites

Make sure you have the following installed before proceeding:

- [Node.js](https://nodejs.org/en/download/) (version 14.x or later)
- [Yarn](https://yarnpkg.com/getting-started/install)
- [The Graph CLI](https://thegraph.com/docs/en/developer/quick-start/#install-the-graph-cli) (`npm install -g @graphprotocol/graph-cli`)
- [Matchstick](https://thegraph.com/docs/en/developer/matchstick/) (for unit testing)
- [PostgreSQL](https://www.postgresql.org/download/) (for local Graph Node setup)

### Install Dependencies

After cloning the repository, install the required dependencies by running:

```bash
yarn install
```

### Running Tests

1. Ensure that `graph-cli` is installed and your environment is set up correctly.
2. Run the following command to execute the Matchstick tests:

```bash
graph test
```

This will run all tests located in the `tests/` folder and output the results. Matchstick allows you to simulate contract events and validate the behavior of the mappings.
### Code Generation

Before deploying or testing the subgraph, generate the types from your schema:

```bash
graph codegen
```

This command generates TypeScript types from your GraphQL schema and contract ABIs.

### Build the Subgraph

After generating the types, build the subgraph using:

```bash
graph build
```

This will compile the AssemblyScript mappings and prepare the subgraph for deployment.
