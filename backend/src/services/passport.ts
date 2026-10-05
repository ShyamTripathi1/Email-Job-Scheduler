import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { prisma } from './db';

function isRealCredential(value: string | undefined): boolean {
  if (!value) return false;
  const dummies = ['dummy', 'change_me', 'your_', 'xxx', 'placeholder'];
  return !dummies.some((d) => value.toLowerCase().includes(d));
}

export function configurePassport() {
  // ── Google OAuth Strategy ───────────────────────────────────────────────────
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (isRealCredential(googleClientId) && isRealCredential(googleClientSecret)) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId!,
          clientSecret: googleClientSecret!,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error('No email from Google profile'));

            let user = await prisma.user.findFirst({
              where: { OR: [{ googleId: profile.id }, { email }] },
            });

            if (user) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  googleId: profile.id,
                  name: profile.displayName,
                  avatar: profile.photos?.[0]?.value,
                },
              });
            } else {
              user = await prisma.user.create({
                data: {
                  googleId: profile.id,
                  email,
                  name: profile.displayName,
                  avatar: profile.photos?.[0]?.value,
                },
              });
            }

            return done(null, user);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
    console.log('✅ Google OAuth strategy configured');
  } else {
    console.warn('⚠️  Google OAuth: skipped (no real credentials in GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)');
  }

  // ── GitHub OAuth Strategy ───────────────────────────────────────────────────
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (isRealCredential(githubClientId) && isRealCredential(githubClientSecret)) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: githubClientId!,
          clientSecret: githubClientSecret!,
          callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback',
          scope: ['user:email'],
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
          try {
            const email =
              profile.emails?.[0]?.value ||
              `${profile.username}@github.noreply.com`;

            let user = await prisma.user.findFirst({
              where: { OR: [{ githubId: profile.id }, { email }] },
            });

            if (user) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  githubId: profile.id,
                  name: profile.displayName || profile.username,
                  avatar: profile.photos?.[0]?.value,
                },
              });
            } else {
              user = await prisma.user.create({
                data: {
                  githubId: profile.id,
                  email,
                  name: profile.displayName || profile.username,
                  avatar: profile.photos?.[0]?.value,
                },
              });
            }

            return done(null, user);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
    console.log('✅ GitHub OAuth strategy configured');
  } else {
    console.warn('⚠️  GitHub OAuth: skipped (no real credentials in GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET)');
  }

  // ── Serialize / Deserialize ─────────────────────────────────────────────────
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}
