import {
  AllLinksSearchQueryResponse,
  ALL_LINKS_SEARCH_QUERY
} from './../graphql';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Link } from './../types';
import { AuthService } from './../auth.service';
import { Apollo } from 'apollo-angular';
import { Subscription, Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  allLinks: Observable<Link[]>;
  searchText = '';
  loggedIn: Observable<boolean>;
  subscriptions: Subscription[] = [];

  constructor(private apollo: Apollo, private authService: AuthService) {}

  ngOnInit() {
    this.loggedIn = this.authService.isAuthenticated.pipe(
      distinctUntilChanged()
    );
  }

  executeSearch() {
    if (!this.searchText || this.searchText.length < 3) {
      return;
    }
    this.allLinks = this.apollo
      .watchQuery<AllLinksSearchQueryResponse>({
        query: ALL_LINKS_SEARCH_QUERY,
        variables: {
          searchText: this.searchText
        }
      })
      .valueChanges.pipe(map(response => response.data.allLinks));
  }
}
