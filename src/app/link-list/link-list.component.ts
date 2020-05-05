import { LINKS_PER_PAGE } from './../constants';
import { AuthService } from './../auth.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { Observable, Subscription, combineLatest, throwError, of } from 'rxjs';
import {
  map,
  distinctUntilChanged,
  switchMap,
  take,
  catchError,
  tap
} from 'rxjs/operators';
import {
  AllLinksQueryResponse,
  ALL_LINKS_QUERY,
  NEW_LINKS_SUBSCRIPTION,
  NEW_VOTES_SUBSCRIPTION
} from './../graphql';
import { Link, Vote } from './../types';
import { DataProxy } from 'apollo-cache';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ApolloQueryResult } from 'apollo-client';
import { orderBy as _orderBy } from 'lodash';

interface PaginationVariables {
  first: number;
  skip: number;
  orderBy: string;
}

@Component({
  selector: 'app-link-list',
  templateUrl: './link-list.component.html',
  styleUrls: ['./link-list.component.css']
})
export class LinkListComponent implements OnInit, OnDestroy {
  linksToRender: Link[] = [];
  loading = true;
  loggedIn: Observable<boolean>;
  subscriptions: Subscription[] = [];
  allLinksQuery: QueryRef<AllLinksQueryResponse>;
  pageParams$: Observable<number>;
  path$: Observable<string>;
  first$: Observable<number>;
  skip$: Observable<number>;
  orderBy$: Observable<string | null>;
  linksPerPage = LINKS_PER_PAGE;
  count: number;

  constructor(
    private apollo: Apollo,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loggedIn = this.authService.isAuthenticated.pipe(
      distinctUntilChanged()
    );

    this.pageParams$ = this.route.params.pipe(
      map((currentParams: Params) => +currentParams.page)
    );

    this.path$ = this.route.url.pipe(map(segments => segments.toString()));

    this.first$ = this.path$.pipe(
      map(path => {
        // distinguishes between new/:page and top
        const isNewPage = path.includes('new');
        return isNewPage ? this.linksPerPage : 100;
      })
    );

    this.skip$ = combineLatest(this.path$, this.pageParams$).pipe(
      map(([path, page]) => {
        const isNewPage = path.includes('new');
        return isNewPage ? (page - 1) * this.linksPerPage : 0;
      })
    );

    this.orderBy$ = this.path$.pipe(
      map(path => {
        const isNewPage = path.includes('new');
        return isNewPage ? 'createdAt_DESC' : null;
      })
    );

    const getQuery = (
      variables: PaginationVariables
    ): Observable<ApolloQueryResult<AllLinksQueryResponse>> => {
      const query = this.apollo.watchQuery<AllLinksQueryResponse>({
        query: ALL_LINKS_QUERY,
        variables
      });

      query.subscribeToMore({
        // represents the subscription itself. will fire for Created events on the link type
        document: NEW_LINKS_SUBSCRIPTION,

        // allows your to determine how the store should be updated with info that was sent by the server
        updateQuery: (previousState, { subscriptionData: { data } }) => {
          console.log('hit', data, previousState);
          if (!data) {
            return previousState;
          }
          const newAllLinks = [...previousState.allLinks, data.Link.node];

          // updating the cache
          return Object.assign({}, previousState, {
            allLinks: newAllLinks
          });
        },
        onError: err => {
          console.log(
            'onError:: subscribeToMore for new links subscription',
            err
          );
        }
      });

      query.subscribeToMore({
        document: NEW_VOTES_SUBSCRIPTION,
        updateQuery: (
          previousState: AllLinksQueryResponse,
          { subscriptionData: { data } }: { subscriptionData: any }
        ) => {
          const votedLinkIndex = previousState.allLinks.findIndex(
            (currentLink: Link) => currentLink.id === data.Vote.node.link.id
          );
          const updatedLink = data.Vote.node.link;
          const newAllLinks = previousState.allLinks.slice();
          newAllLinks[votedLinkIndex] = updatedLink;

          return Object.assign({}, previousState, { allLinks: newAllLinks });

          // return {
          //   ...previousState,
          //   allLinks: newAllLinks
          // };
        },
        onError: err => {
          console.log(
            'onError:: subscribeToMore for New votes subscription',
            err
          );
        }
      });

      return query.valueChanges;
    };

    const allLinksQuery: Observable<
      ApolloQueryResult<AllLinksQueryResponse>
    > = combineLatest(
      // actively listens for changes
      this.first$,
      this.skip$,
      this.orderBy$
      /*
        retrieve the object returned from combineLatest in switchMap and provide it to the getQuery function
        Due the fact that getQuery returns an Observable<ApolloQueryResult<AllLinkQueryResponse>>,
        we will get an Observable<Observable<ApolloQueryResult<AllLinkQueryResponse>>>
        if we use the .map operator. Therefore, we use switchMap to "flatten"
        the Observable<Observable<ApolloQueryResult<AllLinkQueryResponse>>> to an
         Observable<ApolloQueryResult<AllLinkQueryResponse>>
      */
    ).pipe(
      switchMap(([first, skip, orderBy]) => getQuery({ first, skip, orderBy }))
    );

    const allLinksSub = allLinksQuery.subscribe(
      response => {
        this.loading = response.loading;
        this.count = response.data._allLinksMeta.count;
        this.linksToRender = response.data.allLinks;
      },
      error => console.log('error from link-list', error)
    );

    this.subscriptions = [...this.subscriptions, allLinksSub];
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      if (sub && sub.unsubscribe) {
        sub.unsubscribe();
      }
    });
  }

  get orderedLinks(): Observable<Link[]> {
    return this.route.url.pipe(
      map(segments => segments.toString()),
      map(path => {
        if (path.includes('top')) {
          // sorts votes.length in link object in desc order
          return _orderBy(this.linksToRender, 'votes.length', 'desc');
        } else {
          return this.linksToRender;
        }
      })
    );
  }

  get isFirstPage(): Observable<boolean> {
    return this.pageParams$.pipe(map(pageNumber => pageNumber === 1));
  }

  get isNewPage(): Observable<boolean> {
    return this.route.url.pipe(
      map(segments => segments.toString()),
      map(path => {
        return path.includes('new');
      })
    );
  }

  get morePages(): Observable<boolean> {
    return this.pageParams$.pipe(
      map(pageNumber => pageNumber < this.count / this.linksPerPage)
    );
  }

  nextPage() {
    const page = +this.route.snapshot.params.page;
    if (page < this.count / this.linksPerPage) {
      const nextPage = page + 1;
      this.router.navigate(['/new/', nextPage]);
    }
  }

  previousPage() {
    const page = this.route.snapshot.params.page;
    if (page > 1) {
      this.router.navigate(['/new/', page - 1]);
    }
  }

  updateStoreAfterVote = (
    store: DataProxy,
    createdVote: Vote,
    linkId: string
  ) => {
    let variables: PaginationVariables;

    combineLatest(this.first$, this.skip$, this.orderBy$)
      .pipe(
        map(([first, skip, orderBy]) => ({ first, skip, orderBy })),
        take(1)
      )
      .subscribe(variablesObject => {
        variables = variablesObject;
      });

    // read the cached data for all links query
    const data: AllLinksQueryResponse = store.readQuery({
      query: ALL_LINKS_QUERY,
      variables
    });
    // retrieve the link that the user just voted for from that list.
    // update its votes to the votes that were just returned from the server
    const linkThatWasVoted = data.allLinks.find(link => link.id === linkId);
    // linkThatWasVoted.votes = [{Vote}] createdVote.link.votes = [{Vote},{Vote}]
    linkThatWasVoted.votes = createdVote.link.votes;
    console.log('hit again', linkThatWasVoted, createdVote);
    store.writeQuery({ query: ALL_LINKS_QUERY, variables, data });
    // store update will trigger a component re-render
  }
}
