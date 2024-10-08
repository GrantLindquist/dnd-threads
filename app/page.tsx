'use client';
import { Box, Button, Typography } from '@mui/material';
import { useUser } from '@/hooks/useUser';
import {
  getAdditionalUserInfo,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import db, { auth } from '@/utils/firebase';
import { User, UserBase } from '@/types/User';
import { doc, setDoc } from '@firebase/firestore';
import { setUserSession } from '@/utils/userSession';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAlert } from '@/hooks/useAlert';

export default function AuthPage() {
  const { user, setListening } = useUser();
  const { displayAlert } = useAlert();
  const router = useRouter();

  // TODO: Session isn't being set in prod - prod env is undefined???
  const handleSignIn = async () => {
    try {
      console.log('signing in...');
      console.log('env key: ' + process.env.SESSION_ENCRYPTION_KEY);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Define user values from Google
      console.log(result.user);
      const user = result.user;
      let session: UserBase = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        id: user.uid,
      };

      // If creating account, set new user doc with default values
      const additionalUserInfo = getAdditionalUserInfo(result);
      if (additionalUserInfo?.isNewUser) {
        session = {
          ...session,
          campaignIds: [],
          createdAt: Date.now(),
        } as User;
        await setDoc(doc(db, 'users', user.uid), session);
      }

      // Set session
      await setUserSession(session);
      setListening(true);
      router.push('/campaigns');
    } catch (e: any) {
      displayAlert({
        message: 'An error occurred while signing in.',
        isError: true,
        errorType: e.name,
      });
    }
  };

  return (
    <Box p={5}>
      {user ? (
        <>
          <Typography>You are already signed in. </Typography>
          <Link href={'/campaigns'}>Go to your Campaigns</Link>
        </>
      ) : (
        <Button onClick={handleSignIn}>Sign-in with Google</Button>
      )}
    </Box>
  );
}
