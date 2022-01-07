(() => {
    //請求明細の支払方法を変更するテーブル
    //変更処理のときの流れ
    //・割賦枠チェック・カード有効性チェック
    //・請求額を一括枠から割賦へ移行

    kintone.events.on('app.record.detail.show', event1 => {
        const header1 = kintone.app.record.getSpaceElement('btn1');
        const button1 = new Kuc.Button({
            text: '支払方法変更',
            type: 'alert'
        });
        button1.addEventListener('click', event_m1 => {
            var record = kintone.app.record.get().record;
            //有効性確認
            var authory = {
                "app": '20',
                "query": '会員番号="' + record['会員番号'].value + '"',
            }
            return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', authory).then(function (resp1) {
                //情報取得
                if (!resp1.records.length) {
                    //情報なし
                    Swal.fire({
                        title: "前提条件エラー(PM-AU-CS-1001)",
                        html: "事前確認中にエラーが発生しました。<br>・該当会員番号がありません。",
                        icon: "error"
                    }).then(function () {
                        return false;
                    })
                } else {
                    //情報を取得する
                    var change_amount = record['請求額'].value;
                    var change_rec_no = kintone.app.record.getId();
                    var resp1_record = resp1.records["0"];
                    var card_flag = resp1_record["状態"].value;
                    var credit_limit_1 = resp1_record["総合可能枠"].value;
                    var credit_limit_sp = resp1_record["割賦可能枠"].value;
                    var credit_use_1 = resp1_record["総合利用額"].value;
                    var credit_use_revo = resp1_record["リボ利用額"].value;
                    var credit_use_sp = resp1_record["分割利用額"].value;

                    //判定1: カード有効性確認
                    if (card_flag != "有効") {
                        //エラー
                        Swal.fire({
                            title: "事前審査エラー(PM-AU-CS-2001)",
                            html: "事前審査の結果、該当会員は以下の理由により変更登録できません。<br>詳しくは、会員情報を確認してください。<br>【理由】<br>・カードが有効ではありません。",
                            icon: "error"
                        }).then(function () {
                            return false;
                        })
                    } else {
                        if (record['支払済回数'].value) {
                            //支払回数存在
                            Swal.fire({
                                title: "前提条件エラー(PM-AU-CS-1005)",
                                html: "事前確認中にエラーが発生しました。<br>・すでに支払が始まっている請求は変更できません",
                                icon: "error"
                            }).then(function () {
                                return false;
                            })
                        }
                        //有効のとき
                        //判定2: 可能枠が変更額 ＞ 可能枠でないか
                        var er = "";
                        var ef = 0;
                        if (change_amount > credit_limit_1) {
                            //総合枠超過
                            er = "・総合枠が超過しています<br>"
                            ef = 1;
                        } else if (change_amount > credit_limit_sp) {
                            //割賦枠超過
                            er = er + "・割賦枠が超過しています<br>";
                            ef = 1;
                        }
                        //ef = 1のときは、エラー表示の上、強制変更か選択させる
                        if (ef === 1) {
                            Swal.fire({
                                title: "確認(PM-AU-CS-9001)",
                                html: "以下の項目がエラーとして報告されました。<br>" + er + "<br>カウンセリング等で必要な場合は上長判断で変更することもできます。<br>支払い方法を変更しますか？",
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonText: 'はい',
                                cancelButtonText: 'いいえ'
                            }).then(function (val) {
                                if (val.value) {
                                    //変更登録を行う
                                    Swal.fire({
                                        title: "権限者認証(ST-HO-AT-9999)",
                                        html: "この操作には認証が必要です。<br>パスワードを入力してください",
                                        input: "password",
                                        showCancelButton: true,
                                        confirmButtonText: "認証",
                                        cancelButtonText: "キャンセル"
                                    }).then((result_arr) => {
                                        var result = result_arr.value
                                        if (!result) {
                                            //何もしないでreturn
                                            return false;
                                        } else {
                                            if (result === "00777111") {
                                                //認証完了後質問フォーム表示
                                                Swal.fire({
                                                    title: "支払方法登録(PM-AU-CS-5002)",
                                                    html: '指定する支払方法を選択してください',
                                                    input: 'select',
                                                    inputOptions: {
                                                        '1': '一括',
                                                        '2': '二回',
                                                        'B1': 'ボーナス一括',
                                                        'B2': 'ボーナス二回',
                                                        'R': 'リボ',
                                                        'S': '分割'
                                                    },
                                                    inputPlaceholder: '支払方法を選択',
                                                    showCancelButton: true
                                                }).then(function (result) {
                                                    if (!result.value) {
                                                        //選択なし
                                                        Swal.fire({
                                                            title: "処理キャンセル(HO-UI-XX-9999)",
                                                            text: "処理をキャンセルしました",
                                                            icon: "success"
                                                        }).then(function () {
                                                            return false;
                                                        })
                                                    } else {
                                                        var op = result.value;
                                                        if (op === 'B1' || op === 'B2') {
                                                            //ボーナスのとき
                                                            var Start_month = "";
                                                            if (op === 'B1') {
                                                                //ボ1のとき
                                                                //冬季1ｶﾞﾂ、夏季7/8/9ｶﾞﾂ
                                                                Swal.fire({
                                                                    title: "支払月選択(PM-AU-CS-6001)",
                                                                    html: "ボーナス払いの支払月を選択してください",
                                                                    input: 'select',
                                                                    inputOptions: {
                                                                        '1': '1月',
                                                                        '7': '7月',
                                                                        '8': '8月',
                                                                        '9': '9月',
                                                                    },
                                                                    inputPlaceholder: '支払月を選択',
                                                                    showCancelButton: true
                                                                }).then(function (result2) {
                                                                    if (!result2.value) {
                                                                        //選択なし
                                                                        Swal.fire({
                                                                            title: "処理キャンセル(HO-UI-XX-9999)",
                                                                            text: "処理をキャンセルしました",
                                                                            icon: "success"
                                                                        }).then(function () {
                                                                            return false;
                                                                        })
                                                                    } else {
                                                                        //最終確認
                                                                        Swal.fire({
                                                                            title: "最終確認(PM-AU-CS-7012)",
                                                                            html: '以下の内容で支払を変更します。<br>よろしいですか?<br>・ボーナス一括払い(支払月:' + result.value + '月)',
                                                                            icon: "warning",
                                                                            showCancelButton: true,
                                                                            confirmButtonText: 'はい',
                                                                            cancelButtonText: 'いいえ'
                                                                        }).then(function (result3) {
                                                                            if (!result3.value) {
                                                                                //選択なし
                                                                                Swal.fire({
                                                                                    title: "処理キャンセル(HO-UI-XX-9999)",
                                                                                    text: "処理をキャンセルしました",
                                                                                    icon: "success"
                                                                                }).then(function () {
                                                                                    return false;
                                                                                })
                                                                            } else {
                                                                                //■利息計算■
                                                                                pay_change(change_rec_no,op,result.value,change_amount);
                                                                            }
                                                                        })
                                                                    }
                                                                })
                                                            } else {
                                                                //ボ2のとき
                                                                //今月がいつかで判定
                                                                //冬季1ｶﾞﾂ・夏季8ｶﾞﾂ
                                                                //8ｶﾞﾂ以降 -> 1ｶﾞﾂスタート
                                                                //1ｶﾞﾂ以降 -> 8ｶﾞﾂスタート
                                                                var now = new Date();
                                                                var now_month = (now.getMonth() + 1)
                                                                if (now_month >= "8") {
                                                                    //8月より大きい
                                                                    Start_month = "1"
                                                                } else if (now_month >= "1" && now_month < "8") {
                                                                    //1ｶﾞﾂ~8ｶﾞﾂ
                                                                    Start_month = "8"
                                                                }
                                                                Swal.fire({
                                                                    title: "最終確認(PM-AU-CS-7012)",
                                                                    html: '以下の内容で支払を変更します。<br>よろしいですか?<br>・ボーナス二回払い(支払スタート月:' + Start_month + '月)',
                                                                    icon: "warning",
                                                                    showCancelButton: true,
                                                                    confirmButtonText: 'はい',
                                                                    cancelButtonText: 'いいえ'
                                                                }).then(function (result3) {
                                                                    if (!result3.value) {
                                                                        //選択なし
                                                                        Swal.fire({
                                                                            title: "処理キャンセル(HO-UI-XX-9999)",
                                                                            text: "処理をキャンセルしました",
                                                                            icon: "success"
                                                                        }).then(function () {
                                                                            return false;
                                                                        })
                                                                    } else {
                                                                        //■利息計算■
                                                                    }
                                                                })
                                                            }
                                                        } else if (op === 'S') {
                                                            //分割払い
                                                            Swal.fire({
                                                                title: "支払回数選択(PM-AU-CS-6011)",
                                                                html: "分割払いの支払回数を選択してください",
                                                                input: 'select',
                                                                inputOptions: {
                                                                    '3': '3回',
                                                                    '5': '5回',
                                                                    '6': '6回',
                                                                    '8': '8回',
                                                                    '10': '10回',
                                                                    '12': '12回',
                                                                },
                                                                inputPlaceholder: '支払回数を選択',
                                                                showCancelButton: true
                                                            }).then(function (sel1) {
                                                                if (!sel1.value) {
                                                                    Swal.fire({
                                                                        title: "処理キャンセル(HO-UI-XX-9999)",
                                                                        text: "処理をキャンセルしました",
                                                                        icon: "success"
                                                                    }).then(function () {
                                                                        return false;
                                                                    })
                                                                } else {
                                                                    //回数確認
                                                                    Swal.fire({
                                                                        title: "最終確認(PM-AU-CS-7012)",
                                                                        html: '以下の内容で支払を変更します。<br>よろしいですか?<br>・分割払い(支払回数:' + sel1.value + '回)',
                                                                        icon: "warning",
                                                                        showCancelButton: true,
                                                                        confirmButtonText: 'はい',
                                                                        cancelButtonText: 'いいえ'
                                                                    }).then(function(result3){
                                                                        if (!result3.value) {
                                                                            //選択なし
                                                                            Swal.fire({
                                                                                title: "処理キャンセル(HO-UI-XX-9999)",
                                                                                text: "処理をキャンセルしました",
                                                                                icon: "success"
                                                                            }).then(function () {
                                                                                return false;
                                                                            })
                                                                        } else {
                                                                            //■利息計算■
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }else{
                                                            //それ以外
                                                            var PM = "";
                                                            if(op == "1"){
                                                                PM = "一括"
                                                            }else if(op == "2"){
                                                                PM = "二回"
                                                            }else if(op == "R"){
                                                                PM = "リボ"
                                                            }
                                                            //回数確認
                                                            Swal.fire({
                                                                title: "最終確認(PM-AU-CS-7012)",
                                                                html: '以下の内容で支払を変更します。<br>よろしいですか?<br>・'+PM+'払',
                                                                icon: "warning",
                                                                showCancelButton: true,
                                                                confirmButtonText: 'はい',
                                                                cancelButtonText: 'いいえ'
                                                            }).then(function(result3){
                                                                if (!result3.value) {
                                                                    //選択なし
                                                                    Swal.fire({
                                                                        title: "処理キャンセル(HO-UI-XX-9999)",
                                                                        text: "処理をキャンセルしました",
                                                                        icon: "success"
                                                                    }).then(function () {
                                                                        return false;
                                                                    })
                                                                } else {
                                                                    //■利息計算■
                                                                }
                                                            })
                                                        }
                                                    }
                                                })
                                            } else {
                                                Swal.fire({
                                                    title: "認証エラー(ST-HO-AT-1001)",
                                                    html: "認証できませんでした<br>管理者にご確認ください",
                                                    icon: "error"
                                                })
                                                return false;
                                            }
                                        }
                                    })
                                } else {
                                    Swal.fire({
                                        title: "処理キャンセル(HO-UI-XX-9999)",
                                        text: "処理をキャンセルしました",
                                        icon: "success"
                                    }).then(function () {
                                        return false;
                                    })
                                }
                            })
                        }
                    }
                }
            })
        })
        header1.appendChild(button1)
    })
})();