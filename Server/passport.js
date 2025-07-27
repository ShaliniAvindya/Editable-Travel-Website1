const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('./models/User'); 
require('dotenv').config(); 

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/users/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { id, displayName, emails } = profile;
        const email = emails[0].value;

        // Find existing user or create a new one
        let user = await User.findOne({ email });
        if (!user) {
          user = new User({
            name: displayName,
            email,
            password: null, 
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error('Error during Google login:', error);
        return done(error, null);
      }
    }
  )
);

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: '/users/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'emails'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { id, displayName, emails } = profile;
        const email = emails ? emails[0].value : `${id}@facebook.com`;

        // Find existing user or create a new one
        let user = await User.findOne({ email });
        if (!user) {
          user = new User({
            name: displayName,
            email,
            password: null, 
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error('Error during Facebook login:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
