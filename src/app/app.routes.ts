import { Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { RegistrationComponent } from './auth/registration/registration.component';
import { ChatroomComponent } from './components/chat-components/chatroom/chatroom.component';

export const routes: Routes = [
    {path: "", component: HomeComponent},
    
    {path: "auth/register", component: RegistrationComponent},
    {path: "auth/login", component: LoginComponent},
    {path: "chatroom", component: ChatroomComponent},
];