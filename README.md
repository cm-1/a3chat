# a3chat
This assignment contains my submission for the chat assignment of the Web Based Systems course I am taking. One of the requirements for this assignment is that it's hosted on GitHub, so that's the main reason it's here.

As suggested by the professor, a starting point for this code was the chat tutorial by Socket.IO, which can be found at https://socket.io/get-started/chat/ (or at web.archive.org, depending on when you read this and what the future holds). However, the assignment requires many more features, and so the resulting code should look quite different.

## Can I Use This?

Sure. Unless you're also submitting a chat assignment for a Web Based Systems course, in which case maybe it's better you just read this if you get stuck.

I currently have assigned an MIT license to this project. I may assign a more free license later, when I have the time to (a) breath and (b) read through the different options. Regardless of what the license is, though, I really do not care at all whether this gets reused, how it gets reused, whether I'm credited...

If you *have* the chance, though, it may be nice to credit the socket.io tutorial as the inspiration for this code. At bare minimum, keep any comments I have that link back to them.

## What Features Are There?

Hopefully, by the time you read this, I will have implemented:
1. Basic responsive design.
2. Timestamps (calculated by the server)
3. Random, unique nicknames upon connection
4. Bottom-aligning of text (this is supposed to be challenging!) and a scroll bar
5. History
    + Memory of at least the last 200 messages. This is *probably* better to do in memory than on disk, given that this is just a school assignment...
    + The *entire* remembered chat log is displayed to the user upon connection
6. List of all online users. Instantly updated for all users whenever someone joins/disconnects.
7. Changing of nicknames using the `/nick <new nickname>` command
    + Command is refused if the nickname is not unique
    + Nickname change produces *instant* refresh for all users, making the change visible to all of them
8. Change of nickname colour via `/nickcolor RRGGBB` command
    + Again, change is instantly shown to all users...
9. User-posted messages are bolded (not so much a feature as an assignment requirement...)
10. Persistence via Cookies.
    + If a user disconnects, then reconnects, they keep their nickname.
11. Supports 5+ concurrent users at a time.
12. Tested to work in both Chrome and Firefox. \[I'll try to test Edge wherever possible. Safari and Internet Explorer are probably on their own...\]

Finally, the following is a **note to myself to make sure it works on the lab's Linux computers. I will have plenty of time to test this on the weekend, given that the University owns me and I live nowhere else.**

## Awesome! How can I use this?
Readme instructions to come.

You'll need NodeJS, since that's what's used for the server side. I always like including a .txt file containing all package install commands I've run, so you'll probably also find that here soon. Fun.





