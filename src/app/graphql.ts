import { Link, User, Vote } from './types';
import gql from 'graphql-tag';

// skip defines the offset where the query will start
// skip: 10 means it will skip the first 10 items and will not be included in the response
// first: defines the limit/number of items you want to load from the list
export const ALL_LINKS_QUERY = gql`
  query AllLinksQuery($first: Int, $skip: Int, $orderBy: LinkOrderBy) {
    allLinks(first: $first, skip: $skip, orderBy: $orderBy) {
      id
      createdAt
      description
      url
      postedBy {
        id
        name
      }
      votes {
        id
        user {
          id
        }
      }
    }
    _allLinksMeta {
      count
    }
  }
`;

export interface AllLinksQueryResponse {
  allLinks: Link[];
  _allLinksMeta: { count: number };
  loading: boolean;
}

// line 5: AllLinksQuery is the operation name and will be used by Apollo to refer to this query
// in its internals

export const ALL_LINKS_SEARCH_QUERY = gql`
  query AllLinksSearchQuery($searchText: String!) {
    allLinks(
      filter: {
        OR: [
          { url_contains: $searchText }
          { description_contains: $searchText }
        ]
      }
    ) {
      id
      url
      description
      createdAt
      postedBy {
        id
        name
      }
      votes {
        id
        user {
          id
        }
      }
    }
  }
`;

export interface AllLinksSearchQueryResponse {
  loading: boolean;
  allLinks: Link[];
}

export const CREATE_LINK_MUTATION = gql`
  mutation CreateLinkMutation(
    $description: String!
    $url: String!
    $postedById: ID!
  ) {
    createLink(description: $description, url: $url, postedById: $postedById) {
      id
      description
      url
      createdAt
      postedBy {
        name
        id
        votes {
          id
        }
      }
      votes {
        id
      }
    }
  }
`;

export interface CreateLinkMutationResponse {
  createLink: Link;
  loading: boolean;
}

export const SIGNUP_USER_MUTATION = gql`
  mutation SignupUserMutation(
    $email: String!
    $password: String!
    $name: String!
  ) {
    signupUser(name: $name, email: $email, password: $password) {
      id
    }
    # here we have two mutations. The execution order is from top to bottom.
    # we are creating a new user and signing in in a single request
    authenticateUser(email: $email, password: $password) {
      token
      id
    }
  }
`;

export interface SignupUserMutationResponse {
  loading: boolean;
  signupUser: {
    id: string;
  };
  authenticateUser: {
    token: string;
    id: string;
  };
}

export const AUTENTICATE_USER_MUTATION = gql`
  mutation AuthenticateUserMutation($email: String!, $password: String!) {
    authenticateUser(email: $email, password: $password) {
      token
      id
    }
  }
`;

export interface AuthenticateUserMutationResponse {
  authenticateUser: {
    token: string;
    id: string;
  };
}

export const CREATE_VOTE_MUTATION = gql`
  mutation CreateVoteMutation($userId: ID!, $linkId: ID!) {
    createVote(userId: $userId, linkId: $linkId) {
      id
      link {
        id
        votes {
          id
          user {
            id
          }
        }
      }
      user {
        id
      }
    }
  }
`;

export interface CreateVoteMutationResponse {
  loading: boolean;
  createVote: {
    id: string;
    link: Link;
    user: User;
  };
}

export const NEW_LINKS_SUBSCRIPTION = gql`
  subscription NewLinksSubscription {
    Link(filter: { mutation_in: [CREATED] }) {
      node {
        id
        url
        description
        createdAt
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
      mutation
    }
  }
`;

export interface NewLinksSubscriptionResponse {
  node: Link;
}

export const NEW_VOTES_SUBSCRIPTION = gql`
  subscription NewVotesSubscription {
    Vote(filter: { mutation_in: [CREATED] }) {
      node {
        id
        link {
          id
          url
          description
          createdAt
          postedBy {
            id
            name
          }
          votes {
            id
            user {
              id
            }
          }
        }
        user {
          id
        }
      }
    }
  }
`;

export interface NewVotesSubscriptionResponse {
  node: Vote;
}
