import { SearchComponent } from './search/search.component';
import { LoginComponent } from './login/login.component';
import { CreateLinkComponent } from './create-link/create-link.component';
import { LinkListComponent } from './link-list/link-list.component';
import { NgModule } from '@angular/core';
import { RouterModule, Route } from '@angular/router';

const routes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/new/1'
  },
  {
    path: 'new/:page',
    component: LinkListComponent
  },
  {
    path: 'top',
    component: LinkListComponent
  },
  {
    path: 'create',
    component: CreateLinkComponent,
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'search',
    component: SearchComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
