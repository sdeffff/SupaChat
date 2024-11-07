import { Injectable } from '@angular/core';

//Database:
import { arrayUnion } from 'firebase/firestore';
import { ref, get, set, update, remove, serverTimestamp, push } from 'firebase/database';
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

    if(currentUser.uid === friend.uid) {
      alert("You cannot send a request to yourself");
      return;
    }

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

  //----------------------------------------------------
  //Chat functionality:
  //Chat ID generation:
  private currentUserChat: string = localStorage.getItem('currentUserChat') || "";

  generateChatId(uid: string) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    return currentUser.uid > uid ? `${currentUser.uid}_${uid}` : `${uid}_${currentUser.uid}`;
  }

  //Change chat:
  async changeChat(uid: string) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
    this.currentUserChat = this.generateChatId(uid);
    localStorage.setItem('currentUserChat', this.currentUserChat);

    const chatRef = ref(db, "userchats/" + currentUser.uid + "/chatrooms/" + this.currentUserChat),
          snap = await(get(chatRef));

    if(!snap.exists()) {
      this.createChat(uid);
    } else {
      const chatRef = ref(db, "chatrooms/" + snap.val().chatRoomId);

      const chatSnap = await get(chatRef);
      localStorage.setItem('currentChat', chatSnap.key || "");

      this.getMessages();
    }
  }

  //Chat Creation:
  async createChat(uid: string) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentUserChat = this.generateChatId(uid);

    const currUserChatRef = ref(db, "userchats/" + currentUser.uid + "/chatrooms/" + this.currentUserChat),
          friendChatRef = ref(db, "userchats/" + uid + "/chatrooms/" + this.currentUserChat);

    const snap = await get(currUserChatRef);

    if(snap.exists()) return;

    const chatRef = ref(db, "chatrooms/"),
          newChatRef = push(chatRef);

    set(newChatRef, {
      createdAt: serverTimestamp(),
      chatId: newChatRef.key,
      messages: [],
    });

    localStorage.setItem('currentChat', newChatRef.key || "");

    update(currUserChatRef, {
        chatRoomId: newChatRef.key,
        lastMsg: "",
        receiverId: uid,
        updatedAt: Date.now(),
    });

    update(friendChatRef, {
        chatRoomId: newChatRef.key,
        lastMsg: "",
        receiverId: currentUser.uid,
        updatedAt: Date.now(),
    });
  }

  async getMessages() {
    const chatId = localStorage.getItem('currentChat'),
          chatRef = ref(db, `chatrooms/${chatId}/messages`),
          chatSnap = await get(chatRef),
          messages: Array<{content: string, senderId: string, timestamp: number}> = [];

    if (!chatSnap.exists()) return [];

    const chatData = chatSnap.val();
    
    for(let messageId in chatSnap.val()) {
      messages.push(chatData[messageId]);
    }
    
    return messages;
  }

  async sendMessage(message: string) {
    if (!message || message.trim() === "") return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}'),
          chatId = localStorage.getItem('currentChat');

    if (!currentUser || !chatId) {
        console.error("Current user or chat ID not found.");
        return;
    }

    const messageData = {
        content: message.trim(),
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
    };

    let chatRef = ref(db, `chatrooms/${chatId}/messages`);
    const chatRefSnap = await get(chatRef);

    if (!chatRefSnap.exists()) chatRef = ref(db, `chatrooms/${chatId}/messages/` + 1);
    else chatRef = ref(db, `chatrooms/${chatId}/messages/` + (chatRefSnap.size + 1));

    await set(chatRef, messageData);

    const currentUserChatRef = ref(db, `userchats/${currentUser.uid}/chatrooms/${this.currentUserChat}`);
    const receiverId = (await get(currentUserChatRef)).val()?.receiverId;

    if (!receiverId) {
        console.error("Receiver ID not found.");
        return;
    }

    const friendChatRef = ref(db, `userchats/${receiverId}/chatrooms/${this.currentUserChat}`);
    const updates = {
        lastMsg: messageData.content,
        updatedAt: Date.now(),
    };

    await update(currentUserChatRef, updates);
    await update(friendChatRef, updates);
  }
}
