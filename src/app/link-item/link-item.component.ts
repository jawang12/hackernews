import { DataProxy } from 'apollo-cache';
import { CREATE_VOTE_MUTATION } from './../graphql';
import { Apollo } from 'apollo-angular';
import { GC_USER_ID } from './../constants';
import { Link } from './../types';
import { Component, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { timeDifferenceForDate } from '../utils';
import { FetchResult } from 'apollo-link';

interface UpdateStoreAfterVoteCallback {
  (proxy: DataProxy, mutationResult: FetchResult, linkId: string);
}

@Component({
  selector: 'app-link-item',
  templateUrl: './link-item.component.html',
  styleUrls: ['./link-item.component.css']
})
export class LinkItemComponent implements OnDestroy {
  @Input() link: Link;
  @Input() index = 0;
  @Input() isAuthenticated = false;
  @Input() updateStoreAfterVote: UpdateStoreAfterVoteCallback;

  subscriptions: Subscription[] = [];

  constructor(private apollo: Apollo) {}

  voteForLink() {
    const userId = localStorage.getItem(GC_USER_ID);
    const didUserVote = this.link.votes.find(vote => vote.user.id === userId);
    if (didUserVote) {
      alert(`User ${userId} has already voted for this link`);
      return;
    }
    const linkId = this.link.id;
    const mutationSub = this.apollo
      .mutate({
        mutation: CREATE_VOTE_MUTATION,
        variables: {
          userId,
          linkId
        },
        // update function will be called when the server returns a response
        update: (store, { data: { createVote } }) => {
          this.updateStoreAfterVote(store, createVote, linkId);
        }
      })
      .subscribe(
        response => console.log(response),
        error => console.error(error, 'link-item')
      );
    this.subscriptions = [...this.subscriptions, mutationSub];
  }

  humanizeDate(date: string) {
    return timeDifferenceForDate(date);
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub && sub.unsubscribe) {
        sub.unsubscribe();
      }
    }
  }
}
