import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { Status } from 'app/src-bex/utils/RedditAPI';

type AuthResponse = {
  code: string;
  state: string;
  status: Status;
  error?: string;
};

export function useRedditAuth() {
  const { bex } = useQuasar();

  const isWaitingRedditAuth = ref(false);
  const isRedditAuthCompleted = ref(false);

  async function initRedditAuth() {
    isWaitingRedditAuth.value = true;

    const { data: authURL } = await bex.send('getAuthURL');
    const authWindow = window.open(authURL, 'BloomSyncRedditLogin');
    if (authWindow === null) {
      isWaitingRedditAuth.value = false;
      throw new Error('Failed to open auth window', {
        cause: 'auth_window_failed',
      });
    }

    let authData: AuthResponse;

    try {
      authData = await new Promise<AuthResponse>((resolve, reject) => {
        function listener({
          data,
        }: MessageEvent<{ code: string; state: string; status: Status }>) {
          const { status, code, state } = data;
          // filter out unrelated messages from other sources (e.g. other extensions)
          if (!code && !state && !status && !(status in Status)) {
            return;
          }

          window.removeEventListener('message', listener);
          resolve(data);
        }

        function waitForAuth(authWindow: WindowProxy) {
          const interval = setInterval(() => {
            if (!authWindow.closed) {
              return;
            }

            clearInterval(interval);
            reject(
              new Error('Reddit Authorization window closed', {
                cause: 'auth_window_closed',
              }),
            );
          }, 100);
        }

        window.addEventListener('message', listener);
        waitForAuth(authWindow);
      });
    } catch (e) {
      const error = e as Error;
      if (error.cause !== 'auth_window_closed') {
        throw error;
      }

      isWaitingRedditAuth.value = false;
      return;
    }

    const { data: authResult } = await bex.send('authorise', authData);
    if (!authResult.success) {
      isWaitingRedditAuth.value = false;

      const { message, cause } = authResult.error;
      throw new Error(message, { cause });
    }

    isWaitingRedditAuth.value = false;
    isRedditAuthCompleted.value = true;
  }

  return {
    initRedditAuth,
    isWaitingRedditAuth,
    isRedditAuthCompleted,
  };
}
