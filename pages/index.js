// app.js

// Import required modules
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const axios = require('axios'); // Add axios package

// Create an Express application
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(session({ secret: 'fb6a56b479b7e64ebfdc158494c10d5a424e06689072c0905ba240671e21986c', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Passport Configuration
passport.use(new DiscordStrategy({
    clientID: '1201992682491355216',
    clientSecret: '_bWY2gopg0BxvsKLilss4JNbKKDWo8YH',
    callbackURL: 'http://localhost:3000/auth/discord/callback/miller',
    scope: ['identify']
}, (accessToken, refreshToken, profile, done) => {
    // Save user to session or database
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Routes
app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback/miller', passport.authenticate('discord', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/');
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.get('/', isAuthenticated, (req, res) => {
    res.render('dashboard.ejs', { user: req.user });
});

// New route to handle form submission
app.post('/submit-form', isAuthenticated, (req, res) => {
    const { serial, id, username, account, reason, playtime, field7, field8, field9, field10 } = req.body;
    sendDiscordMessage(req.user, { serial, id, username, account, reason, playtime, field7, field8, field9, field10 });
    // Redirect to a different route to prevent form resubmission on refresh
    res.redirect('/submission-confirmation');
});

app.get('/submission-confirmation', (req, res) => {
    res.render('submission_confirmation.ejs'); // Render submission confirmation page
});

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/login');
    });
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Function to send a message to Discord channel using bot token
// Function to send a message to Discord channel using bot token
function sendDiscordMessage(userProfile, formData) {
    const botToken = 'MTIwMTk5MjY4MjQ5MTM1NTIxNg.Gune67.nUPql4lYMSI15AiOMJm4aNs4yVwe1TF3jJZ-3I'; // Replace this with your bot token

    // Get the avatar URL of the sender
    const avatarURL = `https://cdn.discordapp.com/avatars/${userProfile.id}/${userProfile.avatar}.png`;

    // Constructing the description part of the embed message
    let description = '```js\n';
    for (const key in formData) {
        if (formData.hasOwnProperty(key) && key !== 'field7' && key !== 'field8' && key !== 'field9' && key !== 'field10') {
            description += `${key}: ${formData[key]}\n`;
        }
    }
    description += '```';

    // Constructing the embed message
    const embedMessage = {
        embeds: [{
            title: 'New submission',
            description: description,
            color: 0x00ff00, // Green color
            thumbnail: {
                url: avatarURL // Add sender's avatar as thumbnail
            }
        }],
        components: [{
            type: 1, // ActionRow type
            components: [
                {
                    type: 2, // Button type
                    style: 3, // Green style (accept)
                    label: 'Accept',
                    custom_id: 'cor' // Unique ID for accept button
                },
                {
                    type: 2, // Button type
                    style: 4, // Red style (reject)
                    label: 'Reject',
                    custom_id: 'nor' // Unique ID for reject button
                }
            ]
        }]
    };

    // Sending the embed message to Discord channel
    axios.post(`https://discord.com/api/channels/1208117161281986620/messages`, embedMessage, {
        headers: {
            Authorization: `Bot ${botToken}`
        }
    })
    .then(response => {
        console.log('Message sent to Discord channel');
    })
    .catch(error => {
        console.error('Error sending message to Discord channel:', error);
    });
}



// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
