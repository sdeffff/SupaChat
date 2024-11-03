import { Injectable } from '@angular/core';

//Database:
import { ref, get, set, update, remove } from 'firebase/database';
import { db } from '../../../../environments/environment.dev';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor() { }

  //Friends functionality:

  //----------------------------------------------------
  //#1 Search for a friend:
  async searchFriend(name: string) {
    const usersRef = ref(db, "users/");

    const snapshot = await get(usersRef);
    if(snapshot.exists()) {
      const users = snapshot.val();

      return Object.values(users)
        .filter((user: any) => user.name && user.name.toLowerCase().includes(name.toLowerCase()))
        .map((user: any) => {
          return {
            name: user.name,
            uid: user.uid,
          }
        })
    }

    return [];
  }

  //----------------------------------------------------
  //#2 Send a friend request:
  async sendRequest(friend: {name: string, uid: string}) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const ownRequestsRef = ref(db, "requests/" + currentUser.uid + "/ownRequests"),
          friendRequestsRef = ref(db, "requests/" + friend.uid + "/friendRequests"),
          friendsRef = ref(db, "users/" + currentUser.uid + "/friends");

    const friendSnapshot = await get(friendsRef);
    if(friendSnapshot.exists()) {
      const friends = friendSnapshot.val();

      if(friends[friend.uid]) {
        alert("You are already friends with this user");
        return;
      }
    }

    const ownRequestsSnapshot = await get(ref(db, "requests/" + currentUser.uid + "/ownRequests/" + friend.uid));
    if(ownRequestsSnapshot.exists()) {
      alert("You have already sent a request to this user");
      return;
    }

    alert("Request sent to " + friend.name);

    update(ownRequestsRef, {
      [friend.uid]: {
        name: friend.name,
        uid: friend.uid,
        status: "requested",
      }
    })

    update(friendRequestsRef, {
      [currentUser.uid]: {
        name: currentUser.displayName,
        uid: currentUser.uid,
        pfp: currentUser.photoURL,
        status: "requested",
      }
    })
  }

  //----------------------------------------------------
  //#3 Get requests from db:
  async getRequests() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const requestsRef = ref(db, "requests/" + currentUser.uid + "/friendRequests");

    const snapshot = await get(requestsRef);

    if(snapshot.exists()) {
      const friendRequests = snapshot.val();

    return  Object.values(friendRequests)
                  .map((request: any) => ({
                    name: request.name,
                    uid: request.uid,
                    pfp: request.pfp,
                  }));
    } else {
      return [];
    }
  }

  //----------------------------------------------------
  //#4 Accept a friend request:
  async acceptRequest(request: {name: string, uid: string, pfp: string}) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const friendRequestsRef = ref(db,`requests/${currentUser.uid}/friendRequests/${request.uid}`),
          ownRequestsRef = ref(db,`requests/${request.uid}/ownRequests/${currentUser.uid}`);

    await remove(ownRequestsRef);
    await remove(friendRequestsRef);

    update(ref(db, "users/" + currentUser.uid + "/friends"), {
      [request.uid]: {
        name: request.name,
        uid: request.uid,
        pfp: request.pfp,
      }
    });

    update(ref(db, "users/" + request.uid + "/friends"), {
      [currentUser.uid]: {
        name: currentUser.displayName,
        uid: currentUser.uid,
        pfp: currentUser.photoURL,
      }
    });
  }

  //----------------------------------------------------
  //#5 Get friends of current user from db:
  async getFriends() { 
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const friendsRef = ref(db, "users/" + currentUser.uid + "/friends");

    const snapshot = await get(friendsRef);

    if(snapshot.exists()) {
      const friends = snapshot.val();

      return Object.values(friends)
        .map((friend: any) => ({
          name: friend.name,
          uid: friend.uid,
          pfp: friend.pfp,
        }));
    } else {
      return [];
    }
  }
}
