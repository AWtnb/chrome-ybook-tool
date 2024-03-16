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
        askfor: info,
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

type copyFinishedCallback = () => void;

const clearCopyStatus = () => {
  Array.from(
    document.querySelectorAll<HTMLElement>('button.with-copy')
  ).forEach((elem) => {
    elem.classList.remove('finished');
  });
};

const copyText = (text: string, callback: copyFinishedCallback) => {
  clearCopyStatus();
  navigator.clipboard.writeText(text).then(callback, () => {
    console.log('failed to copy:', text);
  });
};

chrome.runtime.onMessage.addListener((request) => {
  if (request.id === 'slack-slash-command') {
    const button = document.getElementById(request.id);
    if (request.payload.enabled) {
      button?.removeAttribute('disabled');
    }
    button!.addEventListener('click', () => {
      copyText(request.payload.slashCmd, () => {
        const url = 'https://digi-yuhi.slack.com/archives/C03HZP034P5';
        window.open(url, '_blank');
      });
    });
    return;
  }
  if (request.id === 'x-post-content') {
    const button = document.getElementById(request.id);
    if (request.payload.enabled) {
      button?.removeAttribute('disabled');
    }
    button!.addEventListener('click', () => {
      window.open(request.payload.intentUrl, '_blank');
    });
    return;
  }
  if (request.id === 'x-thread-content') {
    const button = document.getElementById(request.id);
    if (request.payload.enabled) {
      button?.removeAttribute('disabled');
    }
    button!.addEventListener('click', () => {
      copyText(request.payload.twtContent, () => {
        const url =
          'https://twitter.com/search?q=from%3Ayuhikaku_nibu&src=typed_query&f=live';
        window.open(url, '_blank');
      });
    });
    return;
  }
  if (request.id === 'x-juhan-content') {
    const button = document.getElementById(request.id);
    if (request.payload.enabled) {
      button?.removeAttribute('disabled');
    }
    button!.addEventListener('click', () => {
      window.open(request.payload.intentUrl, '_blank');
    });
    return;
  }
  if (request.id === 'meta-content') {
    const button = document.getElementById(request.id);
    if (request.payload.enabled) {
      button?.removeAttribute('disabled');
    }
    button!.addEventListener('click', () => {
      copyText(request.payload.content, () => {
        const url =
          'https://business.facebook.com/latest/composer?ref=biz_web_content_manager_published_posts&asset_id=101509805373062&context_ref=POSTS&business_id=114292853233117';
        window.open(url, '_blank');
      });
    });
    return;
  }
  if (request.id === 'threads-content') {
    const button = document.getElementById(request.id);
    if (request.payload.enabled) {
      button?.removeAttribute('disabled');
    }
    button!.addEventListener('click', () => {
      copyText(request.payload.content, () => {
        const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(
          request.payload.content
        )}`;
        window.open(url, '_blank');
      });
    });
    return;
  }
  if (request.id === 'genpon') {
    const button = document.getElementById(request.id);
    button!.addEventListener('click', () => {
      copyText(request.payload.content, () => {
        button?.classList.add('finished');
      });
    });
    return;
  }
  if (request.id === 'hasso') {
    const button = document.getElementById(request.id);
    button!.addEventListener('click', () => {
      copyText(request.payload.content, () => {
        button?.classList.add('finished');
      });
    });
    return;
  }
});
