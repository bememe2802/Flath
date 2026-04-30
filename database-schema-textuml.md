# Flath Database Schema (TextUML)

## Tổng quan Database Technologies

| Service | Database | Technology |
|---------|----------|------------|
| identity-service | MySQL | JPA (Hibernate) |
| profile-service | Neo4j | Spring Data Neo4j |
| post-service | MongoDB | Spring Data MongoDB |
| chat-service | MongoDB | Spring Data MongoDB |
| notification-service | MongoDB | Spring Data MongoDB |
| file-service | MongoDB | Spring Data MongoDB |
| newsfeed-service | Redis | Cache |
| study-service | MySQL | JPA (Hibernate) |
| search-service | (chưa implement) | - |

---

## 1. identity-service (MySQL)

```
+----------------------------------------------------+
|                    identity (MySQL)                 |
+----------------------------------------------------+

+====================+       +============================+
|       User         |       |      user_roles            |
+====================+       +============================+
| PK id: UUID(str)   |------>| PK user_id: UUID(str)     |
| username: varchar  |       | PK role_name: varchar     |
| password: varchar  |       +============================+
| email: varchar     |
| email_verified:bool|       +============================+
+====================+       |      role_permissions      |
        |                   +============================+
        |                   | PK role_name: varchar      |
        |                   | PK permission_name: varchar|
        |                   +============================+
        |
        v
+====================+       +============================+
|       Role         |------>|      Permission            |
+====================+       +============================+
| PK name: varchar   |       | PK name: varchar          |
| description: varchar|      | description: varchar      |
+====================+       +============================+

+============================+
|    InvalidatedToken        |
+============================+
| PK id: varchar             |
| expiry_time: datetime      |
+============================+
```

---

## 2. profile-service (Neo4j - Graph)

```
+============================================================+
|                    profile (Neo4j)                          |
+============================================================+

  [:user_profile]
+====================================+
|           UserProfile              |
+====================================+
| PK id: UUID(str)                   |
| userId: string (unique)            |
| username: string                   |
| email: string                      |
| firstName: string                  |
| lastName: string                   |
| avatar: string                     |
| dob: date                          |
| city: string                       |
+====================================+
```

> **Note:** Neo4j là graph database, có thể dễ dàng mở rộng thêm relationships như `FOLLOWS`, `FRIEND_OF` giữa các UserProfile nodes trong tương lai.

---

## 3. post-service (MongoDB)

```
+============================================================+
|                    post (MongoDB)                           |
+============================================================+

+====================================+
|           Post                     |
+====================================+
| PK _id: ObjectId                   |
| userId: string                     |
| content: string                    |
| sharedPostId: string (nullable)    |
| likedUserIds: Set<string>          |
| comments: List<PostComment>        |
| shareCount: int                    |
| createdDate: Instant               |
| modifiedDate: Instant              |
+====================================+
        |
        | contains (embedded)
        v
+====================================+
|        PostComment (embedded)      |
+====================================+
| id: string                         |
| userId: string                     |
| content: string                    |
| parentCommentId: string (nullable) |
| likedUserIds: Set<string>          |
| replies: List<PostComment>         |-- recursive embedded
| createdDate: Instant               |
+====================================+
```

---

## 4. chat-service (MongoDB)

```
+============================================================+
|                    chat (MongoDB)                           |
+============================================================+

+====================================+
|        Conversation                |
+====================================+
| PK _id: ObjectId                   |
| type: string (GROUP | DIRECT)      |
| participantsHash: string (unique)  |
| participants: List<ParticipantInfo> |
| createdDate: Instant               |
| modifiedDate: Instant              |
+====================================+
        |
        | 1:N (referenced by conversationId)
        v
+====================================+
|        ChatMessage                 |
+====================================+
| PK _id: ObjectId                   |
| conversationId: string (indexed)   |
| message: string                    |
| sender: ParticipantInfo (embedded) |
| createdDate: Instant (indexed)     |
+====================================+

+====================================+
|     ParticipantInfo (embedded)     |
+====================================+
| userId: string                     |
| username: string                   |
| firstName: string                  |
| lastName: string                   |
| avatar: string                     |
+====================================+
```

---

## 5. notification-service (MongoDB)

```
+============================================================+
|              notification (MongoDB)                         |
+============================================================+

+============================================+
|        InAppNotification                   |
+============================================+
| PK _id: ObjectId                           |
| eventKey: string                           |
| recipientUserId: string                    |
| actorUserId: string                        |
| actorUsername: string                      |
| actorFirstName: string                     |
| actorLastName: string                      |
| actorAvatar: string                        |
| type: string                               |
| title: string                              |
| message: string                            |
| postId: string (nullable)                  |
| read: boolean                              |
| createdDate: Instant                       |
+============================================+
```

---

## 6. file-service (MongoDB)

```
+============================================================+
|                file (MongoDB)                               |
+============================================================+

+====================================+
|           FileMgmt                 |
+====================================+
| PK _id: ObjectId                   |
| ownerId: string                    |
| contentType: string                |
| size: long                         |
| md5Checksum: string                |
| path: string                       |
+====================================+
```

---

## 7. study-service (MySQL)

```
+============================================================+
|                study (MySQL)                                |
+============================================================+

+============================================+
|           StudySession                     |
+============================================+
| PK id: varchar                             |
| userId: varchar (indexed)                  |
| startedAt: datetime (indexed)              |
| endedAt: datetime                          |
| durationSeconds: bigint                    |
| focusLabel: varchar (nullable)             |
| createdDate: datetime (auto)               |
+============================================+

Indexes:
  - idx_study_session_user_started (userId, startedAt)
  - idx_study_session_started_at (startedAt)
```

---

## 8. newsfeed-service (Redis Cache)

```
+============================================================+
|              newsfeed (Redis - Cache)                       |
+============================================================+

+============================================+
|  Newsfeed Cache (Redis)                    |
+============================================+
| Key pattern: "newsfeed:{userId}"           |
| Value: List<PostResponse> (JSON)           |
| TTL: configurable                          |
+============================================+
```

---

## Tổng quan Relationships giữa các Service

```
+------------------+     +------------------+
|  identity-service|     |  profile-service |
|  (MySQL)         |     |  (Neo4j)         |
|                  |     |                  |
|  User            |---->|  UserProfile     |
|  (userId)        |     |  (userId)        |
+------------------+     +------------------+
        |
        | userId
        v
+------------------+     +------------------+
|  post-service    |     |  chat-service    |
|  (MongoDB)       |     |  (MongoDB)       |
|                  |     |                  |
|  Post.userId     |     |  Conversation    |
|  PostComment     |     |  .participants[] |
|  .userId         |     |  ChatMessage     |
+------------------+     |  .sender.userId  |
        |                +------------------+
        | userId
        v
+------------------+     +------------------+
| notification-svc |     |  file-service    |
|  (MongoDB)       |     |  (MongoDB)       |
|                  |     |                  |
|  InAppNotif      |     |  FileMgmt        |
|  .recipientUserId|     |  .ownerId        |
|  .actorUserId    |     +------------------+
|  .postId --------+---->|  Post.id         |
+------------------+     +------------------+

+------------------+
|  study-service   |
|  (MySQL)         |
|                  |
|  StudySession    |
|  .userId         |
+------------------+

+------------------+
|  newsfeed-svc    |
|  (Redis)         |
|                  |
|  newsfeed:{uid}  |
+------------------+
```

---

## Event-driven Communication (Kafka)

```
+------------------+     +------------------+
|  identity-service|     |  profile-service |
|  (publish)       |---->|  (consume)       |
|  UserCreatedEvent|     |  create profile  |
+------------------+     +------------------+

+------------------+     +------------------+
|  post-service    |     |  newsfeed-service|
|  (publish)       |---->|  (consume)       |
|  PostCreatedEvent|     |  update cache    |
+------------------+     +------------------+

+------------------+     +------------------+
|  post-service    |     | notification-svc |
|  (publish)       |---->|  (consume)       |
|  PostEvents      |     |  send notif      |
+------------------+     +------------------+