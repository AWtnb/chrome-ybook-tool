'use strict';

const requestToActiveTab = (info: string) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab.id) {
      return;
    }
    chrome.tabs.sendMessage(
      tab.id,
      {
        type: info,
      },
      () => {}
    );
  });
};

requestToActiveTab('slack-slash-command');
requestToActiveTab('x-post-content');
requestToActiveTab('x-thread-content');
requestToActiveTab('x-juhan-content');
requestToActiveTab('meta-content');
requestToActiveTab('threads-content');
requestToActiveTab('genpon');
requestToActiveTab('hasso');

const insertPreview = (elem: HTMLElement, content: string) => {
  const pre = document.createElement('pre');
  pre.classList.add('preview');
  const c = document.createElement('code');
  c.innerText = content;
  pre.appendChild(c);
  elem.insertAdjacentElement('beforebegin', pre);
};

const clearCopyStatus = () => {
  Array.from(
    document.querySelectorAll<HTMLElement>('button.with-copy')
  ).forEach((elem) => {
    elem.classList.remove('finished');
  });
};

type copyFinishedCallback = () => void;

const copyText = (text: string, callback: copyFinishedCallback) => {
  clearCopyStatus();
  navigator.clipboard.writeText(text).then(callback, () => {
    console.log('failed to copy:', text);
  });
};

type Payload = {
  type: string;
  content: string;
  enabled: boolean;
};

const setupButton = (payload: Payload): HTMLElement | null => {
  const b = document.getElementById(payload.type);
  if (!b) {
    return null;
  }
  if (payload.enabled) {
    b.removeAttribute('disabled');
  }
  return b;
};

let JUHAN_COUNT: number = 2;

const onJuhanCountChanged = (event: Event) => {
  const v = (event.target as HTMLInputElement).value;
  JUHAN_COUNT = Number(v);
};

const JUHAN_COUNTER = document.getElementById('juhan-count');
JUHAN_COUNTER?.addEventListener('change', onJuhanCountChanged);
JUHAN_COUNTER?.addEventListener('input', onJuhanCountChanged);

chrome.runtime.onMessage.addListener((request) => {
  const payload: Payload = {
    type: request.payload.type,
    content: request.payload.content,
    enabled: request.payload.enabled,
  };

  if (payload.type === 'slack-slash-command') {
    const button = setupButton(payload);
    button!.addEventListener('click', () => {
      copyText(payload.content, () => {
        const url = 'https://digi-yuhi.slack.com/archives/C03HZP034P5';
        window.open(url, '_blank');
      });
    });
    insertPreview(button!, payload.content);
    return;
  }

  if (payload.type === 'x-post-content') {
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      payload.content
    )}`;
    const button = setupButton(payload);
    button!.addEventListener('click', () => {
      window.open(intent, '_blank');
    });
    return;
  }

  if (payload.type === 'x-thread-content') {
    const button = setupButton(payload);
    button!.addEventListener('click', () => {
      copyText(payload.content, () => {
        const url =
          'https://twitter.com/search?q=from%3Ayuhikaku_nibu&src=typed_query&f=live';
        window.open(url, '_blank');
      });
    });
    insertPreview(button!, payload.content);
    return;
  }

  if (payload.type === 'meta-content') {
    const button = setupButton(payload);
    button!.addEventListener('click', () => {
      copyText(payload.content, () => {
        const url =
          'https://business.facebook.com/latest/composer?ref=biz_web_content_manager_published_posts&asset_id=101509805373062&context_ref=POSTS&business_id=114292853233117';
        window.open(url, '_blank');
      });
    });
    insertPreview(button!, payload.content);
    return;
  }

  if (payload.type === 'threads-content') {
    const button = setupButton(payload);
    button!.addEventListener('click', () => {
      copyText(payload.content, () => {
        const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(
          payload.content
        )}`;
        window.open(url, '_blank');
      });
    });
    return;
  }

  if (payload.type === 'x-juhan-content') {
    const c = payload.content;
    const button = setupButton(payload);
    button!.addEventListener('click', () => {
      const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        c.replace('●', String(JUHAN_COUNT))
      )}`;
      window.open(intent, '_blank');
    });
    return;
  }

  if (payload.type === 'genpon') {
    const button = setupButton(payload);
    button!.addEventListener('click', () => {
      copyText(payload.content, () => {
        button?.classList.add('finished');
      });
    });
    return;
  }

  if (payload.type === 'hasso') {
    const button = setupButton(payload);
    button!.addEventListener('click', () => {
      copyText(payload.content, () => {
        button?.classList.add('finished');
      });
    });
    return;
  }
});
