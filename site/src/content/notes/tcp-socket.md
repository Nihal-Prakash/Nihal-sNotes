---
title: "TCP Socket"
slug: "tcp-socket"
topic: "networking"
tags: ["networking", "tcp", "sockets", "unix"]
summary: "Networking notes on UNIX sockets, stream versus datagram sockets, TCP reliability, layered network models, ports, IP addresses, and socket address structures."
pinned: false
order: 30
sourceType: "markdown"
sourcePath: "exports/raw/markdown-sample/f24015c4-e12a-4809-a9a7-200fe91a04e4_ExportBlock-53c76874-b03b-43c1-8489-70a0e73f515c.zip"
createdAt: "2026-06-30"
updatedAt: "2026-06-30"
---
In UNIX everything is done through files - so goes for sockets. We use  specialised `send()` or `recieve()`socket calls from the `socket()`  system routine.

We could use the normal `read()`  or `write()`  but `socket()` gives us better control.

Multiple types of sockets:

There are DARPA Internet addresses (Internet Sockets), path names on a local node (Unix Sockets), CCITT X.25 addresses (X.25 Sockets that you can safely ignore), and probably many others depending on which Unix flavor you run.

For our purposes:

1. Stream Sockets `SOCK_STREAM` 
2. Datagram Sockets `SOCK_DGRAM`  , also called connectionless sockets

> [!tip]
> Lookup RAW SOCKETS

Stream sockets are lossless they achieve this by using Transmission Control Protocol or TCP , to make sure lossless and sequential transfer of data

Datagram Sockets though not as reliable as Stream sockets are still used in places where a few packets lost here and there are that big of a deal - another advantage is speed , such as in multiplayer games.

> It’s way faster to fire-and-forget than it is to keep track of what has arrived safely and make sure it’s in order and all that. If you’re sending chat messages, TCP is great; if you’re sending 40 positional updates per second of the players in the world, maybe it doesn’t matter so much if one or two get dropped, and UDP is a good choice.
> 

> Image from raw Notion export omitted until the asset-import phase.

a packet is born, the packet is wrapped (“encapsulated”) in a header (and rarely a footer) by the first protocol (say, the TFTP protocol), then the whole thing (TFTP header included) is encapsulated again by the next protocol (say, UDP), then again by the next (IP), then again by the final protocol on the hardware (physical) layer (say, Ethernet).

When another computer receives the packet, the hardware strips the Ethernet header, the kernel strips the IP and UDP headers, the TFTP program strips the TFTP header, and it finally has the data.

### Layered Network Model

- Application
- Presentation
- Session
- Transport
- Network
- Data Link
- Physical

A more UNIX focused layer model 👇

- Application Layer (*telnet, ftp, etc.*)
- Host-to-Host Transport Layer (*TCP, UDP*)
- Internet Layer (*IP and routing*)
- Network Access Layer (*Ethernet, wi-fi, or whatever*)

> **Port Numbers**
> 
> 
> Besides an IP address (used by the IP layer), there is another address that is used by TCP (stream sockets) and, coincidentally, by UDP (datagram sockets). It is the *port number*. It’s a 16-bit number that’s like the local address for the connection.
> 
> Think of the IP address as the street address of a hotel, and the port number as the room number.
> 

### Why Port numbers when IP is unique?

An IP address is like the street address of a building — it tells you **where** to send data on the internet.

A port number is like the apartment number or office suite inside that building — it tells you **which specific service or program** should get the data once it arrives.

Without port numbers, an IP could only run one network service at a time, because there would be no way to tell whether incoming data was meant for your web browser, email client, multiplayer game, or some other application.

**Why ports exist despite unique IPs:**

- **One IP, many services:** A single device often runs many networked programs at once (e.g., browser, chat app, game server). Ports let them share the same IP without confusion.
- **Standardized mapping:** Common services use standard port numbers so clients know where to connect (e.g., HTTP → port 80, HTTPS → port 443, SSH → port 22).
- **Virtual hosting:** Servers can host multiple websites or services on one IP, each distinguished by a port number.
- **Efficiency:** Port numbers are part of the TCP/UDP headers, so routers and operating systems can quickly direct traffic to the right socket.

If IP addresses alone were used, you’d need a **new IP address for every single service** you wanted to run — not only impractical but wasteful, especially when IPv4 space is scarce.

> And *this is the important* bit: a pointer to a `struct sockaddr_in` can be cast to a pointer to a `struct sockaddr` and vice-versa. So even though `connect()` wants a `struct sockaddr*`, you can still use a `struct sockaddr_in` and cast it at the last minute!
>
