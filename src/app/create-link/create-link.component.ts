import { Subscription } from 'rxjs';
import { GC_USER_ID, LINKS_PER_PAGE } from './../constants';
import {
  CREATE_LINK_MUTATION,
  ALL_LINKS_QUERY,
  AllLinksQueryResponse
} from './../graphql';
import { Apollo } from 'apollo-angular';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-link',
  templateUrl: './create-link.component.html',
  styleUrls: ['./create-link.component.css']
})
export class CreateLinkComponent implements OnInit, OnDestroy {
  description = '';
  url = '';
  subs: Subscription;
  constructor(private apollo: Apollo, private router: Router) {}

  ngOnInit() {}

  createLink() {
    const postedById = localStorage.getItem(GC_USER_ID);
    if (!postedById) {
      console.error('No user logged in');
      return;
    }

    const newDescription = this.description;
    const newUrl = this.url;
    this.description = '';
    this.url = '';

    this.subs = this.apollo
      .mutate({
        mutation: CREATE_LINK_MUTATION,
        variables: {
          description: newDescription,
          url: newUrl,
          postedById
        },
        // retriggers specfic queries after mutation completes
        // refetchQueries: ['AllLinksQuery']

        // object destructuring of data and createLink createLink represents { Link }
        update: (store, { data: { createLink } }) => {
          // read the data from our cache for this query
          // store = our cache
          const data: AllLinksQueryResponse = store.readQuery({
            query: ALL_LINKS_QUERY,
            variables: {
              first: LINKS_PER_PAGE,
              skip: 0,
              orderBy: 'createdAt_DESC'
            }
          });
          // createLink represents the newly created link object returned from the mutation
          // we then push the link to the end of the allLinks array in the cache:
          // responseData.allLinks.push(createLink);

          // write our data back to the cache
          // first argument represents the query name property in the cache:
          // store.writeQuery({ query: ALL_LINKS_QUERY, data: responseData });

          // can also be written as
          const allLinks = data.allLinks.slice();
          allLinks.unshift(createLink);
          allLinks.pop();
          data.allLinks = allLinks;
          store.writeQuery({
            query: ALL_LINKS_QUERY,
            variables: {
              first: LINKS_PER_PAGE,
              skip: 0,
              orderBy: 'createdAt_DESC'
            },
            data
          });
        }
      })
      .subscribe(
        response => {
          // response object is equivalent to argument 2 of line 41
          console.log(response);
          this.router.navigate(['/']);
        },
        error => {
          console.error(error);
          this.description = newDescription;
          this.url = newUrl;
        }
      );
  }
  ngOnDestroy() {
    if (this.subs && this.subs.unsubscribe) {
      this.subs.unsubscribe();
    }
  }
}

/* line createLink represents this object:
{data: {…}}

  {
    data:
    createLink: {
      createdAt: "2019-02-25T02:28:04.000Z"
      description: "Movie News"
      id: "cjsjq2v870vfj0160uy6466i6"
      url: "Screenrant.com"
     }
__typename: "Link"

*/
