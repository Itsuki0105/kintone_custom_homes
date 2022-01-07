(function () {
  "use strict";
  //レコード追加時に実行。
  function autoNum(event) {
    var record = event.record;
    var min = 10000000000;
    var max = 99999999999;
    var a = Math.floor(Math.random() * (max + 1 - min)) + min;

    var query = {
      "app": kintone.app.getId(),
      "query": '申込番号="' + a + '"'
    }

    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', query).then(function (resp) {
      var records = resp.records;
      if (records.length > 0) {
        //レコード存在
        autoNum(event);
      } else {
        event.record['申込番号'].value = a;
      }
      return event;
    }).catch(function (e) {
      swal({
        title: "APIエラー (" + e.code + ")",
        text: "kintone API処理中にエラーが起きました。\n" + e.message + "\n\nCybozu問合用ID: " + e.id,
        icon: "error",
      })
      //alert("API処理中にエラーが発生しました。 - error: "+e.message);
      return false;
    });
  }

  kintone.events.on('app.record.create.submit', autoNum);

  kintone.events.on('app.record.create.show', function (event) {
    var record = event.record;
    //フィールドを非活性にする
    record['申込番号'].disabled = true;
    record['会員番号'].disabled = true;
    return event;
  });

  kintone.events.on('app.record.index.show', function () {
    //DOM操作（非推奨のため、今後動作しない場合は別の対策が必要
    $(".recordlist-edit-icon-gaia").hide();
    $(".recordlist-remove-gaia").hide();
  })

  kintone.events.on('app.record.edit.show', function (event) {
    var record = event.record;
    var status = record['状態'].value;
    const header = kintone.app.record.getSpaceElement('btn_1');
    const button = new Kuc.Button({
      text: 'マスク解除',
      type: 'alert'
    });
    button.addEventListener('click', event1 => {
      //ボタンの関数
      swal({
        title: "権限者認証(ST-HO-AT-9999)",
        text: "この操作には認証が必要です。\nパスワードを入力してください",
        content: {
          element: "input",
          attributes: {
            type: "password",
          },
        },
        showCanselButton: true,
        ok: "認証",
        cansel: "キャンセル"
      }).then((result) => {
        if (!result) {
          //何もしないでreturn
          return false;
        } else {
          if (result === "00777111") {
            //認証OK
            if (status === "申込中" || status === "審査中" || status === "審査差戻") {
              record['契約カード'].disabled = false;
              var abled_field = [
                '預託額',
                '総合枠',
                '割賦枠',
                '契約日',
                '最終審査日',
                '本人確認書類',
                '本人確認書類_その他',
                '本確実施者',
                '意思確認日時',
                '事故情報'
              ];
              var visible_field = [
                '職業',
                '勤務年数',
                '昨年度年収',
                '先月収入',
                '当月収入',
                '他社Cクレジット残高',
                '他社Sクレジット残高',
                '無担保L残高',
                '有担保L残高',
                '他社Cクレジット件数',
                '他社Sクレジット件数',
                '無担保L件数',
                '有担保L件数',
                '本人確認書類番号',
                '今年度年収予測',
                '判定年収',
                '自動スコアリング合計',
                '審査スコア合計',
                'S枠最大付与額',
                'S有担保計',
                'C無担保計',
                '他社S利用率',
                '他社C利用率',
                '保有期間',
                '官報等調査',
                '事故等申告',
                '申込意思確認',
                '意思確認日時',
                '申込意思確認者',
                '自宅種別',
                '居住年数',
                '配偶者',
                '子供',
                'その他同居者'
              ]
            }else{
              var abled_field = [
                '預託額',
                '状態',
                '総合枠',
                '割賦枠',
                '総合利用額',
                'リボ利用額',
                '分割利用額',
                '本人確認書類',
                '本人確認書類_その他',
                '本確実施者',
                '意思確認日時',
              ];
              var visible_field = [
                '職業',
                '勤務年数',
                '昨年度年収',
                '先月収入',
                '当月収入',
                '他社Cクレジット残高',
                '他社Sクレジット残高',
                '無担保L残高',
                '有担保L残高',
                '他社Cクレジット件数',
                '他社Sクレジット件数',
                '無担保L件数',
                '有担保L件数',
                '本人確認書類番号',
                'S有担保計',
                'C無担保計',
                '保有期間',
                '申込意思確認',
                '意思確認日時',
                '申込意思確認者',
                '自宅種別',
                '居住年数',
                '配偶者',
                '子供',
                'その他同居者'
              ]
            }
            $.each(abled_field, function (i, val) {
              record[val].disabled = false;
            })
            $.each(visible_field, function (i, val) {
              kintone.app.record.setFieldShown(val, true);
            })
          }
        }
      })
    })
    header.appendChild(button);
    //フィールドを非活性にする
    var disabled_field = [
      '申込番号',
      '会員番号',
      '生年月日',
      '申込日',
      'C番',
      '状態',
      '年齢',
      '預託額',
      '総合枠',
      '割賦枠',
      '総合利用額',
      'リボ利用額',
      '分割利用額',
      '契約日',
      '最終審査日',
      '本人確認書類',
      '本人確認書類_その他',
      '本確実施者',
      '意思確認日時',
      '事故情報'
    ];

    var invisible_field = [
      '職業',
      '勤務年数',
      '昨年度年収',
      '先月収入',
      '当月収入',
      '他社Cクレジット残高',
      '他社Sクレジット残高',
      '無担保L残高',
      '有担保L残高',
      '他社Cクレジット件数',
      '他社Sクレジット件数',
      '無担保L件数',
      '有担保L件数',
      '本人確認書類番号',
      '今年度年収予測',
      '判定年収',
      '自動スコアリング合計',
      '審査スコア合計',
      'S枠最大付与額',
      '評価1',
      '評価2',
      '評価3',
      '評価4',
      '評価5',
      '評価6',
      '評価7',
      '評価8',
      '評価9',
      'S有担保計',
      'C無担保計',
      '他社S利用率',
      '他社C利用率',
      '保有期間',
      '官報等調査',
      '事故等申告',
      '申込意思確認',
      '意思確認日時',
      '申込意思確認者',
      '自宅種別',
      '居住年数',
      '配偶者',
      '子供',
      'その他同居者'
    ]
    $.each(disabled_field, function (i, val) {
      record[val].disabled = true
    })
    $.each(invisible_field, function (i, val) {
      kintone.app.record.setFieldShown(val, false);
    })
    if (status === "申込中" || status === "審査中" || status === "審査差戻") {
      record['契約カード'].disabled = false;
    } else {
      record['契約カード'].disabled = true;
    }

    return event;
  });

  kintone.events.on('app.record.edit.submit', function (event) {
    //レコードを変えたときに実行
    if (event.record['状態']['value'] == "カード発行中") {
      if ((event.record['審査スコア合計']['value'] === "") ||
        (!event.record['審査スコア合計']) ||
        (!event.record['総合枠']['value']) ||
        (!event.record['割賦枠']['value'])) {
        swal({
          title: "入力エラー (HO-UI-IP-SJ02)",
          text: "審査結果が不十分です。\n総合枠・割賦枠・審査スコアは必須入力です。",
          icon: "error",
        })
        return false;
      } else {
        var ccc = event.record['会員番号']['value'];
        //alert(ccc);
        if (ccc) {
          //alert("発行なし");
          return event;
        } else {
          //alert("発行");
          //event.record['会員番号'].disabled = false;
          var record = event.record;
          var min = 1000000000;
          var max = 9999999999;
          var a = Math.floor(Math.random() * (max + 1 - min)) + min;

          var query = {
            "app": kintone.app.getId(),
            "query": '会員番号="' + a + '"'
          }

          return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', query).then(function (resp) {
            var records = resp.records;
            if (records.length > 0) {
              //レコード存在
              autoNum(event);
            } else {
              event.record['会員番号'].value = a;
              //alert("aaaa");
            }
            return event;
          }).catch(function (e) {
            swal({
              title: "APIエラー (" + e.code + ")",
              text: "kintone API処理中にエラーが起きました。\n" + e.message + "\n\nCybozu問合用ID: " + e.id,
              icon: "error",
            });
            return false;
          });
        }
      }
    }
  });

  kintone.events.on('app.record.detail.show', function (event) {
    //詳細表示
    var record = event.record;
    var status = record['状態'].value;
    const header2 = kintone.app.record.getSpaceElement('btn_2');
    const header3 = kintone.app.record.getSpaceElement('btn_3');

    if(status === "申込中" || status === "審査差戻"){
      const button2 = new Kuc.Button({
        text: '審査開始',
        type: 'submit'
      });
      const button3 = new Kuc.Button({
        text: '申込キャンセル',
        type: 'normal'
      });
      header2.appendChild(button2);
      header3.appendChild(button3);
    }else if(status === "審査中"){
      const button2 = new Kuc.Button({
        text: '審査終了',
        type: 'submit'
      });
      const button3 = new Kuc.Button({
        text: '申込キャンセル',
        type: 'normal'
      });
      header2.appendChild(button2);
      header3.appendChild(button3);
    }else if(status === "カード発行中"){
      const button2 = new Kuc.Button({
        text: 'カード発行',
        type: 'submit'
      });
      const button3 = new Kuc.Button({
        text: '申込キャンセル',
        type: 'normal'
      });
      header2.appendChild(button2);
      header3.appendChild(button3);
    }else if(status === "有効"){
      const button2 = new Kuc.Button({
        text: '一時停止',
        type: 'submit'
      });
      const button3 = new Kuc.Button({
        text: '解約処理',
        type: 'normal'
      });
      header2.appendChild(button2);
      header3.appendChild(button3);
    }else if(status === "一時停止"){
      const button2 = new Kuc.Button({
        text: '再審査',
        type: 'submit'
      });
      const button3 = new Kuc.Button({
        text: '再発行',
        type: 'normal'
      });
      header2.appendChild(button2);
      header3.appendChild(button3);
    }else if(status === "停止"){
      const button2 = new Kuc.Button({
        text: '再審査',
        type: 'submit'
      });
      header2.appendChild(button2);
    }else if(status === "解約"){
      const button2 = new Kuc.Button({
        text: '解約キャンセル',
        type: 'submit'
      });
      header2.appendChild(button2);
    }else if(status === "強制解約"){}
    


    const header1 = kintone.app.record.getSpaceElement('btn_1');
    const button1 = new Kuc.Button({
      text: 'マスク解除',
      type: 'alert'
    });
    header1.appendChild(button1);
    button1.addEventListener('click', event1 => {
      //ボタンの関数
      swal({
        title: "権限者認証(ST-HO-AT-9999)",
        text: "この操作には認証が必要です。\nパスワードを入力してください",
        content: {
          element: "input",
          attributes: {
            type: "password",
          },
        },
        showCanselButton: true,
        ok: "認証",
        cansel: "キャンセル"
      }).then((result) => {
        if (!result) {
          //何もしないでreturn
          return false;
        } else {
          if (result === "00777111") {
            //認証OK
            if (status === "申込中" || status === "審査中" || status === "審査差戻") {
              record['契約カード'].disabled = false;
              var visible_field = [
                '職業',
                '勤務年数',
                '昨年度年収',
                '先月収入',
                '当月収入',
                '他社Cクレジット残高',
                '他社Sクレジット残高',
                '無担保L残高',
                '有担保L残高',
                '他社Cクレジット件数',
                '他社Sクレジット件数',
                '無担保L件数',
                '有担保L件数',
                '本人確認書類番号',
                '今年度年収予測',
                '判定年収',
                '自動スコアリング合計',
                '審査スコア合計',
                'S枠最大付与額',
                'S有担保計',
                'C無担保計',
                '他社S利用率',
                '他社C利用率',
                '保有期間',
                '官報等調査',
                '事故等申告',
                '申込意思確認',
                '意思確認日時',
                '申込意思確認者',
                '自宅種別',
                '居住年数',
                '配偶者',
                '子供',
                'その他同居者'
              ]
            }else{
              var visible_field = [
                '職業',
                '勤務年数',
                '昨年度年収',
                '先月収入',
                '当月収入',
                '他社Cクレジット残高',
                '他社Sクレジット残高',
                '無担保L残高',
                '有担保L残高',
                '他社Cクレジット件数',
                '他社Sクレジット件数',
                '無担保L件数',
                '有担保L件数',
                '本人確認書類番号',
                'S有担保計',
                'C無担保計',
                '保有期間',
                '申込意思確認',
                '意思確認日時',
                '申込意思確認者',
                '自宅種別',
                '居住年数',
                '配偶者',
                '子供',
                'その他同居者'
              ]
            }
            $.each(visible_field, function (i, val) {
              kintone.app.record.setFieldShown(val, true);
            })
          }
        }
      })
    })
    var invisible_field = [
      '職業',
      '勤務年数',
      '昨年度年収',
      '先月収入',
      '当月収入',
      '他社Cクレジット残高',
      '他社Sクレジット残高',
      '無担保L残高',
      '有担保L残高',
      '他社Cクレジット件数',
      '他社Sクレジット件数',
      '無担保L件数',
      '有担保L件数',
      '本人確認書類番号',
      '今年度年収予測',
      '判定年収',
      '自動スコアリング合計',
      '審査スコア合計',
      'S枠最大付与額',
      '評価1',
      '評価2',
      '評価3',
      '評価4',
      '評価5',
      '評価6',
      '評価7',
      '評価8',
      '評価9',
      'S有担保計',
      'C無担保計',
      '他社S利用率',
      '他社C利用率',
      '保有期間',
      '官報等調査',
      '事故等申告',
      '申込意思確認',
      '意思確認日時',
      '申込意思確認者',
      '自宅種別',
      '居住年数',
      '配偶者',
      '子供',
      'その他同居者'
    ];
    $.each(invisible_field, function (i, val) {
      kintone.app.record.setFieldShown(val, false);
    })
  })
})();