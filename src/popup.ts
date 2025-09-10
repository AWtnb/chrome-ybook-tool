'use strict';

import { RequestType, from5code } from './helper';
import { FILLER } from './pageParser';

const requestToActiveTab = (requestType: RequestType) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab.id) {
      return;
    }
    chrome.tabs.sendMessage(
      tab.id,
      {
        type: requestType,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.log('something happened: ', chrome.runtime.lastError.message);
        }
      }
    );
  });
};

requestToActiveTab('slack-slash-command');
requestToActiveTab('x-post-content');
requestToActiveTab('x-tree-content');
requestToActiveTab('x-juhan-content');
requestToActiveTab('meta-content');
requestToActiveTab('threads-content');
requestToActiveTab('genpon');
requestToActiveTab('hasso');
requestToActiveTab('general-info');
requestToActiveTab('minimal-info');

export type Payload = {
  type: RequestType;
  content: string;
  enabled: boolean;
  params: string[];
};

const insertPreview = (payload: Payload) => {
  const elem = document.getElementById(payload.type);
  const pre = document.createElement('pre');
  pre.classList.add('preview');
  const c = document.createElement('code');
  c.innerText = payload.content;
  pre.appendChild(c);
  elem?.insertAdjacentElement('beforebegin', pre);
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

document
  .getElementById('juhan-count')
  ?.addEventListener('change', (event: Event) => {
    const v = (event.target as HTMLInputElement).value;
    document.getElementById('x-juhan-content')!.setAttribute('juhan-count', v);
  });

const YCODE_INPUT = document.getElementById('ybook-code') as HTMLInputElement;
YCODE_INPUT.focus();

const jumpByCode = () => {
  const url = `https://www.yuhikaku.co.jp/books/detail/${from5code(
    YCODE_INPUT.value
  )}`;
  window.open(url, '_blank');
};
YCODE_INPUT.onkeydown = (ev: KeyboardEvent) => {
  if (ev.key == 'Enter') {
    jumpByCode();
  }
};

document.getElementById('jump-button')?.addEventListener('click', jumpByCode);

chrome.runtime.onMessage.addListener((request) => {
  const payload: Payload = request.payload;

  if (payload.type === 'slack-slash-command') {
    const button = setupButton(payload);
    button?.addEventListener('click', () => {
      copyText(payload.content, () => {
        const url = 'https://digi-yuhi.slack.com/archives/C03HZP034P5';
        window.open(url, '_blank');
      });
    });
    insertPreview(payload);
    return;
  }

  if (payload.type === 'x-post-content') {
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      payload.content
    )}#${payload.params[0]}`;
    const button = setupButton(payload);
    button?.addEventListener('click', () => {
      window.open(intent, '_blank');
    });
    insertPreview(payload);
    return;
  }

  if (payload.type === 'x-tree-content') {
    const button = setupButton(payload);
    button?.addEventListener('click', () => {
      copyText(payload.content, () => {
        button?.classList.add('finished');
      });
    });
    insertPreview(payload);
    return;
  }

  if (payload.type === 'meta-content') {
    const button = setupButton(payload);
    button?.addEventListener('click', () => {
      copyText(payload.content, () => {
        const url =
          'https://business.facebook.com/latest/composer?ref=biz_web_content_manager_published_posts&asset_id=101509805373062&context_ref=POSTS&business_id=114292853233117';
        window.open(url, '_blank');
      });
    });
    insertPreview(payload);
    return;
  }

  if (payload.type === 'threads-content') {
    const button = setupButton(payload);
    button?.addEventListener('click', () => {
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
    const button = setupButton(payload);
    button?.setAttribute('content', payload.content);
    if (payload.enabled) {
      document.getElementById('juhan-count')!.removeAttribute('disabled');
    }
    button?.addEventListener('click', () => {
      const content = button?.getAttribute('content') || '';
      const count = String(button?.getAttribute('juhan-count') || 2);
      const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        content.replace(FILLER, count)
      )}`;
      window.open(intent, '_blank');
    });
    return;
  }

  if (
    payload.type === 'genpon' ||
    payload.type === 'hasso' ||
    payload.type === 'general-info' ||
    payload.type === 'minimal-info'
  ) {
    const button = setupButton(payload);
    button?.addEventListener('click', () => {
      copyText(payload.content, () => {
        button?.classList.add('finished');
      });
    });
    return;
  }
});
