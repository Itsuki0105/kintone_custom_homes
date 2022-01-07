(() => {
  'use strict';
  //ステータスに関して
  /*
  申込中
  申込キャンセル
  審査中
  審査差戻
  審査NG(総合判断)
  カード発行中
  有効
  一時停止（未納）
  一時停止（盗難等）
  一時停止（その他）
  停止（途上NG）
  停止（総合判断）
  強制解約
  解約*/

  //btn_bin_gen => C番生成

  kintone.events.on('app.record.detail.show', event => {
    const header = kintone.app.record.getSpaceElement('btn_1');
    const button = new Kuc.Button({
      text: 'カード番号生成',
      type: 'submit'
    });
    button.addEventListener('click', event => {
      var re = kintone.app.record.get();
      var r = re.record;
      alert(r['C番']['value']);
      if(r['C番']['value'] === undefined || r['C番'].length === 0 || r['C番']['value'] === ""){
        alert("カード発行");
      }else{
        const notification = new Kuc.Notification({
          text:  'カード番号がすでに生成されています。\n再発行の場合は、事故コードを入力してください',
          type: 'danger',
          className: 'options-class'
        });
        notification.open();
      }
    });

    header.appendChild(button);
    return event;
  });
})();