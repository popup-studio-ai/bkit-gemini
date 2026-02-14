---
name: bkend-cookbook
description: |
  bkend.ai practical project tutorials and troubleshooting guide.
  Covers 4 full-guide projects (blog, recipe-app, shopping-mall, social-network)
  with step-by-step implementation patterns including schema design,
  architecture patterns, and AI prompt collections.

  Triggers: cookbook, tutorial, example project, todo app, blog app, shopping mall,
  쿡북, 튜토리얼, 예제, 블로그, 쇼핑몰, 투두, 프로젝트 만들기,
  クックブック, チュートリアル, 例題, ブログ, ショッピング,
  食谱, 教程, 示例, 博客, 商城,
  libro de cocina, tutorial, ejemplo, blog, tienda,
  livre de recettes, tutoriel, exemple, blog, boutique,
  Kochbuch, Tutorial, Beispiel, Blog, Shop,
  ricettario, tutorial, esempio, blog, negozio

  Do NOT use for: authentication details (use bkend-auth), database specifics (use bkend-data),
  security policies (use bkend-security)

user-invocable: true
argument-hint: ""

allowed-tools:
  - read_file
  - write_file
  - replace
  - glob_tool
  - grep_search
  - run_shell_command
  - web_fetch

imports: []

agents:
  backend: bkend-expert

context: session
memory: project
pdca-phase: all
---

# bkend-cookbook

> bkend.ai practical project tutorials and troubleshooting guide

## 1. Projects Overview

| Project | Level | Tables | Frontend | Description |
|---------|-------|--------|----------|-------------|
| **Blog** | Beginner | 3 | Next.js | Personal blog with posts, comments, and user profiles |
| **Recipe App** | Intermediate | 5 | Next.js + Flutter | Cross-platform recipe sharing with categories and favorites |
| **Shopping Mall** | Intermediate | 4 | Next.js | E-commerce with products, orders, and state machine workflow |
| **Social Network** | Beginner | 5 | Flutter | Social feed with posts, comments, likes, and follow system |

### Choosing a Project

- **First time with bkend?** Start with **Blog** -- minimal tables, straightforward CRUD.
- **Want cross-platform?** Pick **Recipe App** -- covers both web and mobile patterns.
- **Need transactional logic?** Go with **Shopping Mall** -- order state machine and payment flow.
- **Building a mobile-first app?** Try **Social Network** -- Flutter-native with feed algorithms.

---

## 2. Blog Project

> Level: Beginner | Tables: 3 | Frontend: Next.js | Time: ~2 hours

### 2.1 Schema Design (3 Tables)

#### users

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| name | string | Yes | Display name |
| email | string | Yes | Unique email address |
| avatar | string | No | Profile image URL |

#### posts

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| title | string | Yes | Post title |
| content | string | Yes | Post body (Markdown supported) |
| authorId | string | Yes | Reference to users table |
| status | string | Yes | `draft` or `published` |
| tags | array | No | List of tag strings |

#### comments

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| content | string | Yes | Comment body |
| postId | string | Yes | Reference to posts table |
| authorId | string | Yes | Reference to users table |

### 2.2 Quick Start (5 Minutes)

#### Step 1: Create the Project

Use the bkend Console or MCP tool to create a new project named `my-blog`.

```
> Create a new project called "my-blog"
```

#### Step 2: Create Tables

Create the three tables with the schemas defined above.

```
> Create a "users" table with columns: name (string, required), email (string, required), avatar (string)
> Create a "posts" table with columns: title (string, required), content (string, required), authorId (string, required), status (string, required), tags (array)
> Create a "comments" table with columns: content (string, required), postId (string, required), authorId (string, required)
```

#### Step 3: Test the API

```bash
# Create a user
curl -X POST https://api.bkend.ai/v1/data/users \
  -H "Content-Type: application/json" \
  -H "X-Project-Id: <your-project-id>" \
  -H "X-Environment: dev" \
  -H "X-API-Key: <your-api-key>" \
  -d '{"name": "Alice", "email": "alice@example.com"}'

# Create a post
curl -X POST https://api.bkend.ai/v1/data/posts \
  -H "Content-Type: application/json" \
  -H "X-Project-Id: <your-project-id>" \
  -H "X-Environment: dev" \
  -H "X-API-Key: <your-api-key>" \
  -d '{"title": "Hello World", "content": "My first post!", "authorId": "<user-id>", "status": "published", "tags": ["intro"]}'

# List all published posts
curl "https://api.bkend.ai/v1/data/posts?filter=%7B%22status%22%3A%22published%22%7D" \
  -H "X-Project-Id: <your-project-id>" \
  -H "X-Environment: dev" \
  -H "X-API-Key: <your-api-key>"
```

### 2.3 AI Prompt Collection

Use these prompts with Gemini CLI or Claude Code to accelerate development:

**Schema & Data:**
```
> Create a blog schema with users, posts, and comments tables
> Add 5 sample blog posts with different tags and statuses
> Query all published posts sorted by newest first
> Find posts tagged with "tutorial" by author Alice
```

**Frontend:**
```
> Generate a Next.js blog layout with header, sidebar, and post list
> Create a Markdown editor component for writing blog posts
> Build a comment section with nested replies
> Add tag filtering to the blog post list page
```

**API Integration:**
```
> Create a bkendFetch wrapper for the blog API
> Build TanStack Query hooks for posts CRUD operations
> Add optimistic update for the comment submission form
> Implement infinite scroll pagination for the post feed
```

---

## 3. Recipe App Project

> Level: Intermediate | Tables: 5 | Frontend: Next.js + Flutter | Time: ~4 hours

### 3.1 Schema Design (5 Tables)

#### users

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| name | string | Yes | Display name |
| email | string | Yes | Unique email address |
| avatar | string | No | Profile image URL |
| bio | string | No | Short biography |

#### recipes

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| title | string | Yes | Recipe name |
| description | string | Yes | Short summary |
| instructions | string | Yes | Step-by-step cooking instructions |
| authorId | string | Yes | Reference to users table |
| categoryId | string | Yes | Reference to categories table |
| cookTime | int | No | Cooking time in minutes |
| servings | int | No | Number of servings |
| imageUrl | string | No | Main recipe image |

#### ingredients

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| recipeId | string | Yes | Reference to recipes table |
| name | string | Yes | Ingredient name |
| quantity | string | Yes | Amount (e.g., "2 cups") |
| unit | string | No | Measurement unit |
| order | int | Yes | Display order |

#### categories

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| name | string | Yes | Category name (e.g., "Italian", "Dessert") |
| slug | string | Yes | URL-friendly identifier |
| icon | string | No | Emoji or icon identifier |

#### favorites

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| userId | string | Yes | Reference to users table |
| recipeId | string | Yes | Reference to recipes table |

### 3.2 Architecture

**Web (Next.js):**

```
Stack: Next.js App Router + TanStack Query + Zustand
```

- **Next.js App Router** -- file-based routing with server components
- **TanStack Query** -- server state management, caching, and background refetching
- **Zustand** -- lightweight client state (UI state, filters, modals)

**Mobile (Flutter):**

```
Stack: Flutter + Dio + Riverpod
```

- **Flutter** -- cross-platform UI framework
- **Dio** -- HTTP client with interceptor support
- **Riverpod** -- state management with dependency injection

### 3.3 AI Prompt Collection

```
> Create the recipe app schema with users, recipes, ingredients, categories, and favorites
> Build a recipe card grid component with image, title, and cook time
> Implement category-based filtering with a sidebar navigation
> Create a favorites toggle button with optimistic update
> Generate a Flutter recipe detail screen with ingredient checklist
```

---

## 4. Shopping Mall Project

> Level: Intermediate | Tables: 4 | Frontend: Next.js | Time: ~5 hours

### 4.1 Schema Design (4 Tables)

#### users

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| name | string | Yes | Display name |
| email | string | Yes | Unique email address |
| address | object | No | Shipping address object |
| phone | string | No | Contact phone number |

#### products

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| name | string | Yes | Product name |
| description | string | Yes | Product description |
| price | int | Yes | Price in cents (to avoid floating point issues) |
| stock | int | Yes | Available inventory count |
| category | string | Yes | Product category |
| imageUrls | array | No | List of product image URLs |
| isActive | bool | Yes | Whether the product is listed |

#### orders

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| userId | string | Yes | Reference to users table |
| status | string | Yes | Order status (see state machine below) |
| totalAmount | int | Yes | Total price in cents |
| shippingAddress | object | Yes | Snapshot of delivery address |
| paymentMethod | string | No | Payment method identifier |
| paidAt | date | No | Timestamp of payment confirmation |
| shippedAt | date | No | Timestamp of shipment |
| deliveredAt | date | No | Timestamp of delivery |

#### order_items

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| orderId | string | Yes | Reference to orders table |
| productId | string | Yes | Reference to products table |
| quantity | int | Yes | Number of items |
| unitPrice | int | Yes | Price per item at time of order (snapshot) |
| subtotal | int | Yes | quantity * unitPrice |

### 4.2 Order State Machine

```
                          +--> cancelled
                          |
draft --> pending --> paid --> shipped --> delivered --> completed
                     |                       |
                     +--> cancelled           +--> cancelled
```

**State Transitions:**

| From | To | Trigger | Side Effect |
|------|----|---------|-------------|
| `draft` | `pending` | User submits order | Validate stock availability |
| `pending` | `paid` | Payment confirmed | Deduct stock, record paidAt |
| `pending` | `cancelled` | Payment timeout / user cancels | Release reserved stock |
| `paid` | `shipped` | Admin ships order | Record shippedAt, generate tracking |
| `paid` | `cancelled` | Admin cancels | Refund payment, restore stock |
| `shipped` | `delivered` | Delivery confirmed | Record deliveredAt |
| `delivered` | `completed` | Auto after 7 days or user confirms | Finalize order |
| `delivered` | `cancelled` | Return / refund request | Process refund, restore stock |

**Implementation Pattern:**

```typescript
// application/services/order-state-machine.ts

type OrderStatus =
  | "draft"
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["pending"],
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
}

export async function transitionOrder(
  orderId: string,
  nextStatus: OrderStatus
): Promise<void> {
  const order = await bkendFetch(`/v1/data/orders/${orderId}`);
  const current = order.data.status as OrderStatus;

  if (!canTransition(current, nextStatus)) {
    throw new Error(
      `Invalid transition: ${current} -> ${nextStatus}`
    );
  }

  const updates: Record<string, any> = { status: nextStatus };

  if (nextStatus === "paid") updates.paidAt = new Date().toISOString();
  if (nextStatus === "shipped") updates.shippedAt = new Date().toISOString();
  if (nextStatus === "delivered") updates.deliveredAt = new Date().toISOString();

  await bkendFetch(`/v1/data/orders/${orderId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}
```

### 4.3 AI Prompt Collection

```
> Create the shopping mall schema with users, products, orders, and order_items tables
> Build a product catalog page with grid view, filters, and sorting
> Implement a shopping cart with Zustand state management
> Create an order checkout flow with address form and payment step
> Build an admin dashboard for order management with status transitions
> Add stock validation before order submission
```

---

## 5. Social Network Project

> Level: Beginner | Tables: 5 | Frontend: Flutter | Time: ~3 hours

### 5.1 Schema Design (5 Tables)

#### users

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| name | string | Yes | Display name |
| email | string | Yes | Unique email address |
| avatar | string | No | Profile image URL |
| bio | string | No | Short biography |
| followersCount | int | No | Counter cache for followers |
| followingCount | int | No | Counter cache for following |

#### posts

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| content | string | Yes | Post text content |
| authorId | string | Yes | Reference to users table |
| imageUrls | array | No | Attached image URLs |
| likesCount | int | No | Counter cache for likes |
| commentsCount | int | No | Counter cache for comments |

#### comments

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| content | string | Yes | Comment body |
| postId | string | Yes | Reference to posts table |
| authorId | string | Yes | Reference to users table |

#### likes

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| postId | string | Yes | Reference to posts table |
| userId | string | Yes | Reference to users table |

#### follows

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| followerId | string | Yes | User who follows |
| followingId | string | Yes | User being followed |

### 5.2 Feed Algorithm Pattern

The social feed displays posts from users that the current user follows, sorted by newest first.

**Step 1: Get the list of users the current user follows**

```
GET /v1/data/follows?filter={"followerId":"<current-user-id>"}&limit=100
```

**Step 2: Extract the followingIds**

```typescript
const followingIds = followsData.data.map(
  (f: { followingId: string }) => f.followingId
);
```

**Step 3: Query posts from followed users**

```
GET /v1/data/posts?filter={"authorId":{"$in":[...followingIds]}}&sort={"createdAt":-1}&limit=20
```

**Complete Feed Implementation (Flutter + Riverpod):**

```dart
// lib/features/feed/providers/feed_provider.dart

final feedProvider = FutureProvider.autoDispose<List<Post>>((ref) async {
  final currentUserId = ref.read(authProvider).userId;
  final client = ref.read(bkendClientProvider);

  // Step 1: Get following list
  final followsRes = await client.get('/v1/data/follows', queryParameters: {
    'filter': '{"followerId":"$currentUserId"}',
    'limit': '100',
  });

  final followingIds = (followsRes.data['data'] as List)
      .map((f) => f['followingId'] as String)
      .toList();

  if (followingIds.isEmpty) return [];

  // Step 2: Get posts from followed users
  final idsJson = followingIds.map((id) => '"$id"').join(',');
  final postsRes = await client.get('/v1/data/posts', queryParameters: {
    'filter': '{"authorId":{"\$in":[$idsJson]}}',
    'sort': '{"createdAt":-1}',
    'limit': '20',
  });

  return (postsRes.data['data'] as List)
      .map((json) => Post.fromJson(json))
      .toList();
});
```

### 5.3 Counter Cache Pattern

Counter caches denormalize counts for performance. When a user likes a post, update both the `likes` table and the `likesCount` on the post.

```dart
Future<void> toggleLike(String postId, String userId, bool isLiked) async {
  if (isLiked) {
    // Unlike: remove like record and decrement counter
    final likesRes = await client.get('/v1/data/likes', queryParameters: {
      'filter': '{"postId":"$postId","userId":"$userId"}',
    });
    final likeId = likesRes.data['data'][0]['_id'];
    await client.delete('/v1/data/likes/$likeId');

    // Decrement counter
    final post = await client.get('/v1/data/posts/$postId');
    final currentCount = post.data['data']['likesCount'] ?? 0;
    await client.put('/v1/data/posts/$postId', data: {
      'likesCount': currentCount - 1,
    });
  } else {
    // Like: create like record and increment counter
    await client.post('/v1/data/likes', data: {
      'postId': postId,
      'userId': userId,
    });

    final post = await client.get('/v1/data/posts/$postId');
    final currentCount = post.data['data']['likesCount'] ?? 0;
    await client.put('/v1/data/posts/$postId', data: {
      'likesCount': currentCount + 1,
    });
  }
}
```

### 5.4 AI Prompt Collection

```
> Create the social network schema with users, posts, comments, likes, and follows tables
> Build a Flutter feed screen with pull-to-refresh and infinite scroll
> Implement a like button with optimistic update and counter cache
> Create a user profile screen with follower/following counts
> Build a follow/unfollow toggle with real-time count update
> Generate a comment bottom sheet with auto-focus text input
```

---

## 6. Common Architecture Patterns

### 6.1 Next.js App Structure

```
app/
  (app)/                    # Authenticated layout group
    dashboard/
      page.tsx
    posts/
      page.tsx
      [id]/
        page.tsx
    settings/
      page.tsx
    layout.tsx              # App shell with sidebar + header
  (auth)/                   # Auth layout group
    login/
      page.tsx
    signup/
      page.tsx
    layout.tsx              # Minimal auth layout
  api/                      # API routes (if needed)
    webhooks/
      route.ts
  layout.tsx                # Root layout
  page.tsx                  # Landing page

application/
  dto/                      # Data Transfer Objects
    post.dto.ts
    user.dto.ts
    order.dto.ts
  hooks/
    queries/                # TanStack Query hooks
      use-posts.ts
      use-users.ts
      use-orders.ts
    mutations/              # TanStack Mutation hooks
      use-create-post.ts
      use-update-order.ts
  services/                 # Business logic
    order-state-machine.ts

infrastructure/
  api/
    client.ts               # bkendFetch wrapper
    endpoints.ts             # API endpoint constants
  auth/
    middleware.ts            # Auth middleware
    session.ts               # Session helpers

components/
  ui/                        # Radix UI primitives
  shared/                    # Shared components
  features/                  # Feature-specific components
```

### 6.2 Flutter App Structure

```
lib/
  core/
    network/
      bkend_client.dart      # Dio client setup
      auth_interceptor.dart   # Token refresh interceptor
      endpoints.dart          # API endpoint constants
    constants/
      app_constants.dart
    theme/
      app_theme.dart
    utils/
      validators.dart

  features/
    auth/
      data/
        auth_repository.dart
      models/
        user_model.dart
      presentation/
        login_screen.dart
        signup_screen.dart
      providers/
        auth_provider.dart

    feed/
      data/
        feed_repository.dart
      models/
        post_model.dart
      presentation/
        feed_screen.dart
        post_card.dart
      providers/
        feed_provider.dart

    profile/
      data/
        profile_repository.dart
      models/
        profile_model.dart
      presentation/
        profile_screen.dart
      providers/
        profile_provider.dart

  shared/
    widgets/
      loading_indicator.dart
      error_widget.dart
      empty_state.dart
    extensions/
      string_extensions.dart
      date_extensions.dart

  app.dart                    # MaterialApp with router
  main.dart                   # Entry point
```

---

## 7. Key Implementation Patterns

### Pattern 1: bkendFetch Wrapper

Centralized API client that handles headers, auth tokens, and error formatting.

```typescript
// infrastructure/api/client.ts
export async function bkendFetch<T = any>(
  path: string,
  options: BkendFetchOptions = {}
): Promise<{ success: boolean; data: T; meta?: any }> {
  const { token, headers: customHeaders, ...rest } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Project-Id": process.env.NEXT_PUBLIC_BKEND_PROJECT_ID!,
    "X-Environment": process.env.NEXT_PUBLIC_BKEND_ENVIRONMENT!,
    ...customHeaders as Record<string, string>,
  };
  if (typeof window === "undefined" && process.env.BKEND_API_KEY) {
    headers["X-API-Key"] = process.env.BKEND_API_KEY;
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BKEND_API_URL}${path}`,
    { headers, ...rest }
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || "bkend API error");
  }
  return res.json();
}
```

### Pattern 2: Mock Mode Toggle

Switch between real API and mock data for offline development.

```typescript
// infrastructure/api/client.ts
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export async function bkendFetch<T>(path: string, options?: BkendFetchOptions): Promise<T> {
  if (USE_MOCK) {
    const { getMockData } = await import("@/mocks/handlers");
    return getMockData<T>(path, options);
  }
  // ... real fetch implementation
}
```

### Pattern 3: DTO Layer

Transform API responses into typed application objects.

```typescript
// application/dto/post.dto.ts
export interface PostDTO {
  _id: string;
  title: string;
  content: string;
  authorId: string;
  status: "draft" | "published";
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostDTO {
  title: string;
  content: string;
  authorId: string;
  status: "draft" | "published";
  tags?: string[];
}

export function toPost(dto: PostDTO): Post {
  return {
    id: dto._id,
    title: dto.title,
    content: dto.content,
    authorId: dto.authorId,
    status: dto.status,
    tags: dto.tags ?? [],
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}
```

### Pattern 4: Query Key Factory

Organized query keys for TanStack Query cache management.

```typescript
// application/hooks/queries/query-keys.ts
export const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (filters: PostFilters) => [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, "detail"] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
};

// Usage:
// queryClient.invalidateQueries({ queryKey: postKeys.lists() });
```

### Pattern 5: Counter Cache

Maintain denormalized counts to avoid expensive aggregate queries.

```typescript
// When creating a comment, also update the post's commentsCount
await bkendFetch("/v1/data/comments", {
  method: "POST",
  body: JSON.stringify({ content, postId, authorId }),
});

const post = await bkendFetch(`/v1/data/posts/${postId}`);
await bkendFetch(`/v1/data/posts/${postId}`, {
  method: "PUT",
  body: JSON.stringify({
    commentsCount: (post.data.commentsCount ?? 0) + 1,
  }),
});
```

### Pattern 6: Order State Machine

See Section 4.2 for the full order state machine implementation.

### Pattern 7: Optimistic Updates

Update the UI before the server confirms, then rollback on error.

```typescript
// application/hooks/mutations/use-toggle-like.ts
export function useToggleLike(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isLiked: boolean) => toggleLikeAPI(postId, isLiked),
    onMutate: async (isLiked) => {
      await queryClient.cancelQueries({ queryKey: postKeys.detail(postId) });
      const previous = queryClient.getQueryData(postKeys.detail(postId));
      queryClient.setQueryData(postKeys.detail(postId), (old: any) => ({
        ...old,
        likesCount: old.likesCount + (isLiked ? -1 : 1),
        isLiked: !isLiked,
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(postKeys.detail(postId), context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
    },
  });
}
```

### Pattern 8: Image Upload with Preview

Upload images to bkend storage with client-side preview.

```typescript
export function useImageUpload() {
  const [preview, setPreview] = useState<string | null>(null);

  const handleUpload = async (file: File): Promise<string> => {
    // Client-side preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to bkend storage
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BKEND_API_URL}/v1/storage/upload`,
      {
        method: "POST",
        headers: {
          "X-Project-Id": process.env.NEXT_PUBLIC_BKEND_PROJECT_ID!,
          "X-Environment": process.env.NEXT_PUBLIC_BKEND_ENVIRONMENT!,
        },
        body: formData,
      }
    );
    const data = await res.json();
    return data.data.url;
  };

  return { preview, handleUpload };
}
```

### Pattern 9: Infinite Scroll Pagination

Cursor-based pagination for feeds and lists.

```typescript
// application/hooks/queries/use-posts-infinite.ts
export function usePostsInfinite(filters?: PostFilters) {
  return useInfiniteQuery({
    queryKey: postKeys.list(filters ?? {}),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("limit", "20");
      if (pageParam) params.set("cursor", pageParam);
      if (filters?.status) {
        params.set("filter", JSON.stringify({ status: filters.status }));
      }
      params.set("sort", JSON.stringify({ createdAt: -1 }));

      return bkendFetch<PostsResponse>(
        `/v1/data/posts?${params.toString()}`
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
  });
}
```

### Pattern 10: Real-time Subscription (Planned)

> Note: Real-time subscriptions are planned for a future bkend.ai release.

```typescript
// Planned API (not yet available)
// const unsubscribe = bkend.subscribe("posts", {
//   filter: { status: "published" },
//   onInsert: (post) => queryClient.invalidateQueries(postKeys.lists()),
//   onUpdate: (post) => queryClient.invalidateQueries(postKeys.detail(post._id)),
//   onDelete: (id) => queryClient.invalidateQueries(postKeys.lists()),
// });
```

### Pattern 11: Auth Middleware

See the bkend-quickstart skill for the full Next.js middleware implementation. Key points:

- Check for `bkend_access_token` cookie
- Auto-refresh using `bkend_refresh_token` when access token expires
- Redirect to `/login` for unauthenticated requests
- Skip auth for public routes

### Pattern 12: Error Boundary

Catch and display errors gracefully at the component level.

```typescript
// components/shared/error-boundary.tsx
"use client";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

export function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  const { reset } = useQueryErrorResetBoundary();
  return (
    <ReactErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="flex flex-col items-center gap-4 p-8">
          <p className="text-red-500">Something went wrong: {error.message}</p>
          <button onClick={resetErrorBoundary} className="btn btn-primary">
            Try Again
          </button>
        </div>
      )}
    >
      {children}
    </ReactErrorBoundary>
  );
}
```

### Pattern 13: Loading Skeleton

Display placeholder UI while data is loading.

```typescript
// components/shared/post-skeleton.tsx
export function PostSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="h-4 bg-gray-200 rounded w-24" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-32 bg-gray-200 rounded w-full" />
    </div>
  );
}
```

### Pattern 14: Form Validation (Zod)

Schema-based validation for forms.

```typescript
// application/dto/post.dto.ts
import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["draft", "published"]),
  tags: z.array(z.string()).max(10, "Maximum 10 tags").optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

// Usage with react-hook-form:
// const form = useForm<CreatePostInput>({
//   resolver: zodResolver(createPostSchema),
// });
```

### Pattern 15: Search Debounce

Debounce search input to reduce API calls.

```typescript
// application/hooks/use-debounced-search.ts
import { useState, useEffect } from "react";

export function useDebouncedSearch(delay = 300) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), delay);
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  return { searchTerm, setSearchTerm, debouncedTerm };
}

// Usage:
// const { searchTerm, setSearchTerm, debouncedTerm } = useDebouncedSearch();
// const { data } = useQuery({
//   queryKey: ["posts", "search", debouncedTerm],
//   queryFn: () => bkendFetch(`/v1/data/posts?filter={"title":{"$regex":"${debouncedTerm}"}}`),
//   enabled: debouncedTerm.length > 0,
// });
```

---

## 8. Dependencies

### Next.js Projects

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16+ | React framework with App Router |
| react | 19+ | UI library |
| @tanstack/react-query | 5 | Server state management |
| zustand | 5+ | Client state management |
| @radix-ui/react-* | latest | Accessible UI primitives |
| tailwindcss | 4 | Utility-first CSS |
| zod | 3+ | Schema validation |
| react-hook-form | 7+ | Form state management |
| @hookform/resolvers | 3+ | Zod integration for react-hook-form |
| date-fns | 4+ | Date utility library |
| lucide-react | latest | Icon library |

### Flutter Projects

| Package | Version | Purpose |
|---------|---------|---------|
| dio | 5+ | HTTP client |
| riverpod | 2+ | State management |
| flutter_riverpod | 2+ | Flutter bindings for Riverpod |
| go_router | 14+ | Declarative routing |
| flutter_secure_storage | 9+ | Secure token storage |
| cached_network_image | 3+ | Image caching |
| intl | 0.19+ | Internationalization |
| json_annotation | 4+ | JSON serialization |
| freezed_annotation | 2+ | Immutable data classes |

---

## 9. Quick Reference

### API Endpoints Used Across Projects

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List records | GET | `/v1/data/{table}` |
| Get record | GET | `/v1/data/{table}/{id}` |
| Create record | POST | `/v1/data/{table}` |
| Update record | PUT | `/v1/data/{table}/{id}` |
| Delete record | DELETE | `/v1/data/{table}/{id}` |
| Upload file | POST | `/v1/storage/upload` |
| Register user | POST | `/v1/auth/register` |
| Login | POST | `/v1/auth/login` |
| Refresh token | POST | `/v1/auth/token/refresh` |

### Query Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `filter` | `{"status":"published"}` | MongoDB-style filter |
| `sort` | `{"createdAt":-1}` | Sort order (1=asc, -1=desc) |
| `limit` | `20` | Max records per page (max 100) |
| `cursor` | `abc123` | Cursor for pagination |
| `select` | `title,content` | Fields to include |

### Next Steps

After completing a cookbook project, consider these skills for deeper topics:

| Skill | When to Use |
|-------|-------------|
| `/bkend-auth` | Implement email/social login, JWT, MFA |
| `/bkend-data` | Advanced queries, relations, aggregations |
| `/bkend-security` | RLS policies, rate limiting, CORS |
| `/bkend-mcp` | MCP tool reference and advanced usage |
| `/bkend-guides` | Migration, troubleshooting, performance tips |
