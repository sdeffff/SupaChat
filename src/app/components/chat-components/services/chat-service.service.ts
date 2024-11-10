import { Injectable } from '@angular/core';

//Database:
import { ref, get, set, update, remove, serverTimestamp, push } from 'firebase/database';
import { db } from '../../../../environments/environment.dev';

import { from, Observable, of, switchMap, tap } from 'rxjs';

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
            pfp: user.pfp,
          }
        })
    }

    return [];
  }

  //----------------------------------------------------
  //#2 Send a friend request:
  sendRequest(friend: {name: string, uid: string}):Observable<any> {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);

    if(currentUser.uid === friend.uid) {
      alert("You cannot send a request to yourself");
      return of();
    }

    const ownRequestsRef = ref(db, "requests/" + currentUser.uid + "/ownRequests"),
          friendRequestsRef = ref(db, "requests/" + friend.uid + "/friendRequests"),
          friendsRef = ref(db, "users/" + currentUser.uid + "/friends");

    return from(get(friendsRef)).pipe(
      switchMap((snap) => {
        if(snap.exists()) {
          const friends = snap.val();

          if(friends[friend.uid]) {
            alert("You are already friends with this user");
            return of();
          }
        } else {
          alert("You are already friends with this user");
          return of();
        }

        const ownRequestsSnapshot = ref(db, "requests/" + currentUser.uid + "/ownRequests/" + friend.uid);

        return from(get(ownRequestsSnapshot)).pipe(
          switchMap((snap) => {
            if(snap.exists()) {
              alert("You have already sent a request to this user");
              return of();
            }

            alert("Request sent to " + friend.name);

            update(ownRequestsRef, {
              [friend.uid]: {
                name: friend.name,
                uid: friend.uid,
                status: "requested",
              }
            })

            return update(friendRequestsRef, {
              [currentUser.uid]: {
                name: currentUser.displayName,
                uid: currentUser.uid,
                pfp: currentUser.photoURL,
                status: "requested",
              }
            })
          }
        ));
    })
  )};

  //----------------------------------------------------
  //#3 Get requests from db:
  getRequests():Observable<any> {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    const requestsRef = ref(db, `requests/${currentUser.uid}/friendRequests`);

    return from(get(requestsRef)).pipe(
        switchMap((snapshot) => {
            if (snapshot.exists()) {
                const friendRequests = snapshot.val();

            return of(Object.values(friendRequests).map((request: any) => ({
                    name: request.name,
                    uid: request.uid,
                    pfp: request.pfp,
                })));
            } else {
                return of([]);
            }
        })
    );
  }

  //----------------------------------------------------
  //#4 Accept a friend request:
  async acceptRequest(request: {name: string, uid: string, pfp: string}) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);

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
  getFriends():Observable<any> { 
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);

    const friendsRef = ref(db, "users/" + currentUser.uid + "/friends");

    return from(get(friendsRef)).pipe(
        switchMap((snapshot) => {
            if (snapshot.exists()) {
                const friends = snapshot.val();

                return of(Object.values(friends).map((friend: any) => ({
                    name: friend.name,
                    uid: friend.uid,
                    pfp: friend.pfp,
                })));
            } else {
                return of([]);
            }
        })
    );
  }

  //----------------------------------------------------
  //Chat functionality:
  //Chat ID generation:
  generateChatId(uid: string) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);

    return currentUser.uid > uid ? `${currentUser.uid}_${uid}` : `${uid}_${currentUser.uid}`;
  }

  //Change chat:
  changeChat(uid: string):Observable<any> {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    const chatId = this.generateChatId(uid);
    const currentUserChatRef = ref(db, `userchats/${currentUser.uid}/chatrooms/${chatId}`);

    localStorage.setItem('currentUserChat', chatId);

    return from(get(currentUserChatRef)).pipe(
        switchMap((snap) => {
            if (!snap.exists()) {
              return this.createChat(uid).pipe(
                switchMap(() => this.getMessages())
            );
            } else {
                const chatRoomId = snap.val().chatRoomId;
                const chatRef = ref(db, `chatrooms/${chatRoomId}`);
                
                return from(get(chatRef)).pipe(
                    tap((chatSnap) => {
                        localStorage.setItem('currentChat', chatSnap.key!);
                    }),
                    switchMap(() => this.getMessages())
                );
            }
        })
    );
  }

  //Chat Creation:
  createChat(uid: string):Observable<any> {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    const chatId = this.generateChatId(uid);
    const currUserChatRef = ref(db, `userchats/${currentUser.uid}/chatrooms/${chatId}`);
    const friendChatRef = ref(db, `userchats/${uid}/chatrooms/${chatId}`);
    
    return from(get(currUserChatRef)).pipe(
        switchMap((snap) => {
            if (snap.exists()) return of(null);

            const chatRef = ref(db, "chatrooms/");
            const newChatRef = push(chatRef);

            return from(set(newChatRef, {
                createdAt: serverTimestamp(),
                chatId: newChatRef.key,
                messages: []
            })).pipe(
                tap(() => localStorage.setItem('currentChat', newChatRef.key!)),
                switchMap(() => {
                    const updates = {
                        chatRoomId: newChatRef.key,
                        lastMsg: "",
                        receiverId: uid,
                        updatedAt: Date.now()
                    };
                    return from(update(currUserChatRef, updates)).pipe(
                        switchMap(() => from(update(friendChatRef, { ...updates, receiverId: currentUser.uid })))
                    );
                })
            );
        })
    );
  }

  getMessages():Observable<any> {
    const chatId = localStorage.getItem('currentChat'),
          chatRef = ref(db, `chatrooms/${chatId}/messages`),
          messages: Array<{content: string, senderId: string, timestamp: number}> = [];

    return from(get(chatRef)).pipe(
        switchMap((snapshot) => {
            if (snapshot.exists()) {
                const chatMessages = snapshot.val();

                return of(Object.values(chatMessages).map((msg: any) => ({
                    content: msg.content,
                    senderId: msg.senderId,
                    timestamp: msg.timestamp,
                })));
            } else {
                return of([]);
            }
        })
    )
  }

  sendMessage(message: string):Observable<any> {
    if (!message || message.trim() === "") return of(); // Return an empty Observable if the message is empty

    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    const chatId = localStorage.getItem('currentChat');

    if (!currentUser || !chatId) {
        console.error("Current user or chat ID not found.");
        return of(); // Return an empty Observable for error cases
    }

    const messageData = {
        content: message.trim(),
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
    };

    // Reference to the chat room's messages
    let chatRef = ref(db, `chatrooms/${chatId}/messages`);

    return from(get(chatRef)).pipe(
        switchMap((chatRefSnap) => {
            // Determine the reference for the new message
            if (!chatRefSnap.exists()) {
                chatRef = ref(db, `chatrooms/${chatId}/messages/1`);
            } else {
                chatRef = ref(db, `chatrooms/${chatId}/messages/${chatRefSnap.size + 1}`);
            }

            // Set the new message in the database
            return from(set(chatRef, messageData));
        }),
        switchMap(() => {
            // Fetch the current user’s chat reference to find receiver ID
          const currentUserChat = localStorage.getItem('currentUserChat');

            const currentUserChatRef = ref(db, `userchats/${currentUser.uid}/chatrooms/${currentUserChat}`);
            return from(get(currentUserChatRef)).pipe(
                switchMap((userChatSnap) => {
                    const receiverId = userChatSnap.val()?.receiverId;
                    if (!receiverId) {
                        console.error("Receiver ID not found.");
                        return of();
                    }

                    const friendChatRef = ref(db, `userchats/${receiverId}/chatrooms/${currentUserChat}`);
                    const updates = {
                        lastMsg: messageData.content,
                        updatedAt: Date.now(),
                    };

                    // Update the last message and timestamp for both users
                    return from(update(currentUserChatRef, updates)).pipe(
                        switchMap(() => from(update(friendChatRef, updates)))
                    );
                })
            );
        }),
        // Call getMessages after all updates are done
        switchMap(() => this.getMessages()),
    );
  }
}