<script setup lang="ts">
const query = new URLSearchParams(window.location.search);
const error = query.get('error');

if (error) {
  const status = error === 'access_denied' ? 'rejected' : 'failed';
  (window.opener as WindowProxy | undefined)?.postMessage({ status, error });
} else {
  (window.opener as WindowProxy | undefined)?.postMessage({
    status: 'completed',
    code: query.get('code'),
    state: query.get('state'),
  });
}

window.close();
</script>
