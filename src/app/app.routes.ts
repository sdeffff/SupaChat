import { Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [
    {path: "", component: HomeComponent},
    
    {path: "login", component: LoginComponent},
];