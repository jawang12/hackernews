import { GC_AUTH_TOKEN } from './constants';
import { NgModule } from '@angular/core';
import { HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Apollo, ApolloModule } from 'apollo-angular';
import { HttpLink, HttpLinkModule } from 'apollo-angular-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { split } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';

@NgModule({
  // export to make public when this module is imported into another module
  exports: [HttpClientModule, ApolloModule, HttpLinkModule]
})
export class GraphQLModule {
  // inject apollo and httpLink so that we can configure them
  constructor(apollo: Apollo, httpLink: HttpLink) {
    const uri = 'https://api.graph.cool/simple/v1/cjsi2n6rq0ayq0167i16b1k0n';
    const token = localStorage.getItem(GC_AUTH_TOKEN);
    const authorization = token ? `Bearer ${token}` : null;
    const headers = new HttpHeaders();
    headers.append('Authorization', authorization);

    // all API Requests are actually created and sent by the httpLink
    const http = httpLink.create({ uri, headers });
    const ws = new WebSocketLink({
      uri: 'wss://subscriptions.graph.cool/v1/cjsi2n6rq0ayq0167i16b1k0n',
      options: {
        reconnect: true, // auto reconnect if failure
        connectionParams: {
          authToken: token
        }
      }
    });

    apollo.create({
      // using the ability to split links, you can send data to each link
      // depending on what kind of operation is being sent
      link: split(
        // split based on operation type
        ({ query }) => {
          const { kind, operation } = getMainDefinition(query);
          return kind === 'OperationDefinition' && operation === 'subscription';
        },
        ws,
        http
      ),
      cache: new InMemoryCache()
    });
  }
}

// const middleware = new ApolloLink((operation, forward) => {
//   const token = localStorage.getItem(GC_AUTH_TOKEN);
//   if (token) {
//     operation.setContext({
//       headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
//     });
//   }
//   return forward(operation);
// });
