---
title: "Server.C"
slug: "server-c"
topic: "networking"
tags: ["c", "network-programming", "server", "signals"]
summary: "C server notes focused on process cleanup, SIGCHLD handling, waitpid, sockaddr setup, getaddrinfo, sockets, bind, listen, accept, and fork-based request handling."
pinned: true
order: 10
sourceType: "markdown"
sourcePath: "exports/raw/markdown-sample/313f6236-5e7a-4d35-9f07-d4c2bcee27fc_ExportBlock-98b98840-c174-4f9a-8366-fb054e4beb03.zip"
createdAt: "2026-06-30"
updatedAt: "2026-06-30"
---
```c
#define PORT "3490"  // the port users will be connecting to

#define BACKLOG 10   // how many pending connections queue will hold

```

---

## Zombie Process Cleaner

```c
void sigchld_handler(int s)
{
	(void)s; // quiet unused variable warning

	// waitpid() might overwrite errno, so we save and restore it:
	int saved_errno = errno;

	while(waitpid(-1, NULL, WNOHANG) > 0);

	errno = saved_errno;
}
```

This handler is a **zombie-cleaner**. When a child dies, the parent’s signal handler runs, quickly calls `waitpid()` in a loop to reap all dead children, and restores `errno`. The parent avoids zombie processes and keeps its error state consistent.

This little function is a **signal handler for `SIGCHLD`** — the signal the kernel sends to a parent process when one of its child processes changes state (usually terminates, but also when it’s stopped or continued).

```c
void sigchld_handler(int s)
{
    (void)s; // quiet unused variable warning

```

- The handler takes an integer argument `s` (the signal number).
- In this case, the handler doesn’t actually care *which* signal was delivered — it’s hardwired for `SIGCHLD`.
- `(void)s;` is a common trick to silence compiler warnings about an unused variable.

```c
    // waitpid() might overwrite errno, so we save and restore it:
    int saved_errno = errno;

```

- `errno` is a global variable that stores the most recent error code from system/library calls.
- Signal handlers can interrupt your code at arbitrary times, and if `waitpid()` fails inside this handler, it may change `errno`.
- That could mess up the parent process’s logic once control returns to normal code.
- So we stash the current `errno` in `saved_errno` before calling `waitpid()`.

```c
    while(waitpid(-1, NULL, WNOHANG) > 0);

```

- `waitpid()` is how a parent process reaps a terminated child.
- Arguments:
    - `1` means “wait for **any** child process.”
    - `NULL` means “I don’t care about the child’s exit status.”
    - `WNOHANG` means “don’t block if no child has exited — just return immediately.”
- The loop is important: if multiple children exit at once, `SIGCHLD` may be delivered only once. The loop ensures all terminated children are reaped in one go.
- If you didn’t do this, you could end up with “zombie” processes — children that have terminated but whose exit status hasn’t been collected by the parent.

```c
    errno = saved_errno;
}

```

- Finally, restore `errno` to whatever it was before entering the handler.
- This makes the signal handler invisible to the rest of the program — the mainline code won’t suddenly see a random `errno` from `waitpid()`.

If you squint at it, it’s like housekeeping: the OS knocks on the door with `SIGCHLD`, the parent opens up, sweeps out all the dead processes, and then goes back to what it was doing as if nothing happened.

Do you want me to also show you how this looks in action — like a simple program that forks a few children and uses this handler to keep the process table tidy?

---

## IP4 or IP6 Address receiving

```c
// get sockaddr, IPv4 or IPv6:
void *get_in_addr(struct sockaddr *sa)
{
    if (sa->sa_family == AF_INET) {
        return &(((struct sockaddr_in*)sa)->sin_addr);
    }

    return &(((struct sockaddr_in6*)sa)->sin6_addr);
}

```

### 1. Function signature

```c
void *get_in_addr(struct sockaddr *sa)

```

- **`void *`**
    
    The function returns a generic pointer (void pointer).
    
    Why? Because the function may return either:
    
    - A pointer to an IPv4 address (`struct in_addr`)
    - A pointer to an IPv6 address (`struct in6_addr`)
        
        These two have **different types**, so `void *` is used as a "generic" return type.
        
- **`struct sockaddr *sa`**
    
    This is the input: a pointer to a `sockaddr` structure.
    
    `sockaddr` is a **generic socket address structure** in C.
    
    Every more specific address type (like IPv4 or IPv6) starts with the same fields, so it can be cast (converted) to the right one.
    

### 2. Check address family

```c
if (sa->sa_family == AF_INET) {

```

- `sa->sa_family` tells us **what type of address** this `sockaddr` holds.
    - `AF_INET` means it's an **IPv4** address.
    - `AF_INET6` means it's an **IPv6** address.

So this `if` checks: "Is the address IPv4?"

### 3. If IPv4

```c
return &(((struct sockaddr_in*)sa)->sin_addr);

```

Let’s break it down:

1. `(struct sockaddr_in*)sa`
    - The generic `sockaddr *` is cast into a **sockaddr_in**(the IPv4-specific version of the structure).
2. `((struct sockaddr_in*)sa)->sin_addr`
    - Accesses the `sin_addr` field inside the `sockaddr_in`.
    - `sin_addr` is a `struct in_addr`, which holds the **actual 32-bit IPv4 address**.
3. `&(((struct sockaddr_in*)sa)->sin_addr)`
    - Returns the **address of sin_addr**, i.e., a pointer to the IPv4 address field.

### 4. If IPv6

```c
return &(((struct sockaddr_in6*)sa)->sin6_addr);

```

Similar steps, but for IPv6:

1. `(struct sockaddr_in6*)sa`
    - Cast the generic `sockaddr *` to the IPv6-specific `sockaddr_in6 *`.
2. `((struct sockaddr_in6*)sa)->sin6_addr`
    - Access the `sin6_addr` field. This is a `struct in6_addr`, which holds the **128-bit IPv6 address**.
3. `&(((struct sockaddr_in6*)sa)->sin6_addr)`
    - Returns a pointer to the IPv6 address field.

### 5. Visual Diagram

**sockaddr_in (IPv4):**

```
struct sockaddr_in {
    short          sin_family;   // AF_INET
    unsigned short sin_port;     // Port number
    struct in_addr sin_addr;     // IPv4 address (32 bits)
};

```

**sockaddr_in6 (IPv6):**

```
struct sockaddr_in6 {
    short           sin6_family; // AF_INET6
    unsigned short  sin6_port;   // Port number
    struct in6_addr sin6_addr;   // IPv6 address (128 bits)
};

```

So this function is like saying:

- If IPv4 → "Give me the pointer to `sin_addr`."
- If IPv6 → "Give me the pointer to `sin6_addr`."

---

## Decalarations

```c
// listen on sock_fd, new connection on new_fd
int sockfd, new_fd;

```

- **`sockfd`**: the *listening* socket’s file descriptor (an `int` on Unix). You create it with `socket()`, bind it, and put it into `listen()` mode.
- **`new_fd`**: every time you `accept()` a client connection on `sockfd`, you get a brand-new connected socket FD in `new_fd`. You use `new_fd` to read/write with that client.

```c
struct addrinfo hints, *servinfo, *p;

```

- **`hints`**: an input template telling `getaddrinfo()` what kinds of addresses you want (IPv4/IPv6, stream/UDP, passive for binding, etc.). You zero it and set fields like `ai_family`, `ai_socktype`, `ai_flags`.
- **`servinfo`**: head of a linked list returned by `getaddrinfo()` with one node per candidate local address you could bind to.
- **`p`**: a loop cursor you use to iterate through `servinfo` until you successfully create/bind a socket.

```c
struct sockaddr_storage their_addr; // connector's address info

```

- A **generic, large-enough** address container for either IPv4 (`sockaddr_in`) or IPv6 (`sockaddr_in6`).
- You pass its address to `accept()` to learn who connected. Later, you can print the peer’s IP using `inet_ntop()` (with the helper `get_in_addr()` you showed earlier).

```c
socklen_t sin_size;

```

- Length variable for socket address structures.

```c
struct sigaction sa;

```

- Used to configure a signal handler, most commonly for **`SIGCHLD`** if your server `fork()`s to handle clients.
- Purpose: reap finished child processes and avoid zombies; and `SA_RESTART` to auto-restart interrupted syscalls.

```c
int yes = 1;

```

- Convenience flag for `setsockopt()`:
    
    ```c
    setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof yes);
    
    ```
    
- **Why?** Lets you re-bind to the same port quickly after restarting the server (avoids “Address already in use” due to TIME_WAIT).

```c
char s[INET6_ADDRSTRLEN];

```

- A buffer to hold a **human-readable IP address string** printed by `inet_ntop()`.
- `INET6_ADDRSTRLEN` is large enough for any IPv6 string (and therefore also IPv4). You’ll use it like:
    
    ```c
    inet_ntop(their_addr.ss_family,
              get_in_addr((struct sockaddr *)&their_addr),
              s, sizeof s);
    printf("Got connection from %s\n", s);
    
    ```
    

```c
int rv;

```

- A generic “return value” variable, typically to store `getaddrinfo()`’s status (0 on success), or other function return codes so you can check and handle errors.

---

### Putting it together (mini-flow)

1. Fill `hints` → call `getaddrinfo()` → iterate with `p` to:
    - `socket()`
    - `setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof yes)`
    - `bind()`
2. `listen(sockfd, BACKLOG)`
3. `sin_size = sizeof their_addr;`
4. `new_fd = accept(sockfd, (struct sockaddr *)&their_addr, &sin_size);`
5. Convert/print client IP with `inet_ntop(..., s, sizeof s)`
6. Optionally use `sigaction` to handle `SIGCHLD` if you’re forking per connection.

This block is essentially the scaffolding for a portable IPv4/IPv6 TCP server.
