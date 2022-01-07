(function () {
    'use strict';
    //btn_assign 調査中にする
    //btn_ng NGにする
    //btn_turnback 差し戻す
    //btn_accept OKにする
    function pause_auth(ev1_sub, fp_status, fp_jijen, fp_ju_dtl, fp_app_id, fp_group_id, fp_div, fp_dvc_cnt) {
        //alert(fp_app_id);
        return new Promise(function (ok, ng) {
            //var input = ev1_sub.record;
            var api2 = {
                "app": '20',
                "query": '会員番号="' + fp_app_id + '"',
            }
            return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', api2).then(function (resp3) {
                if (!resp3.records.length) {
                    //対象レコードなし
                    var er = {
                        title: "入力エラー(CA-BT-80A)",
                        text: "申請者IDが相違しています",
                        icon: "error"
                    }
                    Swal.fire(er);
                    ok(false);
                } else {
                    var rec3 = resp3.records["0"];
                    var input = ev1_sub.record;
                    console.log(ev1_sub);
                    var change_api = {
                        "app": kintone.app.getId(),
                        "id": kintone.app.record.getId(),
                        "record": {
                            "申請ステータス": {
                                value: fp_status,
                            },
                            "判定結果詳細": {
                                value: fp_ju_dtl,
                            },
                            "申請者名義": {
                                value: rec3["氏"]["value"] + "　" + rec3["名"]["value"],
                            },
                            "請求先名義": {
                                value: "グループ請求: " + fp_group_id,
                            },
                            "按分人数": {
                                value: fp_dvc_cnt,
                            },
                            "請求額_1人当たり": {
                                value: fp_div
                            }
                        }
                    }
                    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', change_api, function (resp) {
                        //success
                        ok(ev1_sub);
                    })
                }
            }, function (e) {
                ng(new Error(e));
            })
        })
    }

    function bill_make2(bm_user_id, bm_authory_id, bm_use_date, bm_category, bm_shop, bm_amount) {
        /*
        bm_user_id -> 会員番号
        bm_authory_id -> 申請書番号
        bm_use_date -> 利用日
        bm_category -> 請求種別(按分請求・立替請求)
        bm_shop -> 加盟店名
        bm_amount -> 利用額
        */
        var user_id_veryfy = {
            "app": '20',
            "query": '会員番号="' + bm_user_id + '"',
        }
        return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', user_id_veryfy).then(function (res) {
            //API完了
            var record = res.records;
            if (record.length > 0) {
                //情報あり
                return new Promise(function (success, reject) {
                    var add1 = {
                        "app": '28',
                        "record": {
                            "会員番号": {
                                "value": bm_user_id,
                            },
                            "依頼書番号": {
                                "value": bm_authory_id,
                            },
                            "利用日": {
                                "value": bm_use_date,
                            },
                            "請求カテゴリ": {
                                "value": bm_category,
                            },
                            "加盟店名": {
                                "value": bm_shop,
                            },
                            "請求額": {
                                "value": bm_amount,
                            }
                        }
                    }

                    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', add1, (resp3) => {
                        //登録完了
                        //減算処理を行う
                        //まず現在の値を取得
                        var add2 = {
                            "app": '20',
                            "query": '会員番号="' + bm_user_id + '"',
                        }
                        return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', add2, (resp_ud) => {
                            //現在の利用額をあげるだけ
                            var rec1 = resp_ud.records["0"];
                            var record_id = rec1["レコード番号"]["value"];
                            var sougou_riyou = rec1["総合利用額"]["value"];
                            var am = Number(bm_amount);
                            var sr = Number(sougou_riyou);
                            var sougou_req = sr + am;
                            var check2 = {
                                "app": '20',
                                "id": record_id,
                                "record": {
                                    "総合利用額": {
                                        "value": sougou_req
                                    },
                                }
                            }
                            return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', check2, (req_1) => {
                                //完了
                                success();
                                return true;
                            })
                        }, function (e) {
                            console.log(e);
                        })
                    })
                })
            }
        })
    }

    function pause_auth_kojin2(ev1_sub, fp_status, fp_jijen, fp_ju_dtl, fp_app_id, fp_bill_id, fp_amount) {
        console.log("受信")
        //事前判定結果はなにもしない
        return new Promise(function (ok1, ng1) {
            console.log("Promise(入)")
            var api2 = {
                "app": '20',
                "query": '会員番号="' + fp_app_id + '"'
            }
            return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', api2).then(function (resp3) {
                console.log("API呼び出し1")
                if (!resp3.records.length) {
                    //対象レコードなし
                    var er = {
                        title: "入力エラー(CA-PM-10)",
                        html: "申請者IDが入力されていないか存在しません",
                        icon: "error"
                    }
                    Swal.fire(er).then((e)=>{
                        console.log("APIエラー1")
                        ok1(false);
                    })
                } else {
                    //存在した場合
                    console.log("申請者ID：有効")
                    var api3 = {
                        "app": '20',
                        "query": '会員番号="' + fp_bill_id + '"'
                    }
                    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', api3).then(function (resp4) {
                        console.log("API呼び出し2")
                        if (!resp4.records.length) {
                            //請求対象レコードなし
                            var er = {
                                title: "入力エラー(CA-PM-70)",
                                html: "請求先IDが入力されていないか存在しません",
                                icon: "error"
                            }
                            Swal.fire(er).then((e)=>{
                                console.log("APIエラー2")
                                ok1(false);
                            })
                        } else {
                            var rec3 = resp3.records["0"];
                            var rec4 = resp4.records["0"];
                            var change_api = {
                                "app": kintone.app.getId(),
                                "id": kintone.app.record.getId(),
                                "record": {
                                    "申請ステータス": {
                                        value: fp_status,
                                    },
                                    "判定結果詳細": {
                                        value: fp_ju_dtl,
                                    },
                                    "申請者名義": {
                                        value: rec3["氏"]["value"] + "　" + rec3["名"]["value"],
                                    },
                                    "請求先名義": {
                                        value: "個人請求: " + rec4["氏"]["value"] + "　" + rec4["名"]["value"],
                                    },
                                    "按分人数": {
                                        value: "0",
                                    },
                                    "請求額_1人当たり": {
                                        value: fp_amount
                                    }
                                }
                            }
                            //var input = ev1_sub.record;
                            console.log("func1");
                            console.log(ev1_sub);
                            return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', change_api, function (resp) {
                                console.log("API呼び出し3")
                                //success
                                console.log(resp);
                                ok1(ev1_sub);
                            },function(e){
                                //エラー
                                console.log(e);
                            })
                        }
                    },function(e){
                        console.log(e);
                    })
                }
            },function(e){
                console.log(e);
            })
        },function(e){
            console.log(e);
        })
    }

    kintone.events.on('app.record.detail.show', event => {
        var invisible_field = [
            '事前判定結果',
            '判定結果詳細',
            '申請者名義',
            '請求先名義',
            '按分人数',
            '請求額_1人当たり'
        ];

        $.each(invisible_field, function (i, val) {
            kintone.app.record.setFieldShown(val, false);
        })

        const header1 = kintone.app.record.getSpaceElement('btn_assign');
        const button1 = new Kuc.Button({
            text: '調査中にする',
            type: 'submit'
        });
        button1.addEventListener('click', event => {
            var record = kintone.app.record.get().record;
            var status = record["申請ステータス"].value;
            var judge_detail = record["判定結果詳細"].value;
            const youbi = ["日", "月", "火", "水", "木", "金", "土"];

            const date1 = new Date();
            const date2 = date1.getFullYear() + "年" + (date1.getMonth() + 1) + "月" + date1.getDate() + "日" + youbi[date1.getDay()] + "曜日" + date1.getHours() + "時" + date1.getMinutes() + "分" + date1.getSeconds() + "秒"

            if (status != "審査中" || status === "登録済" || status === "NG" || status === "差戻") {
                //NGと差戻の場合は、それぞれ以下の操作をする
                //NG -> 審査に戻す
                //差戻 -> 相手側から空申請してもらうことで申請になる
                Swal.fire({
                    title: "条件エラー(ST-HO-FL-3001)",
                    html: "ご指定の操作はできません。<br>管理者にご確認ください",
                    icon: "error"
                })
                return false;
            } else {
                //判定
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
                            //合致した場合
                            Swal.fire({
                                title: "変更確認(ST-HO-AD-1000)",
                                html: '申請ステータスを「<font color="red"><b>調査中</b></font>」に変更します。<br>よろしいですか？',
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonText: 'はい',
                                cancelButtonText: 'いいえ'
                            }).then(function (val) {
                                if (val.value) {
                                    console.log("OK");
                                    //APIで変更処理する
                                    var change_api = {
                                        "app": kintone.app.getId(),
                                        "id": kintone.app.record.getId(),
                                        "record": {
                                            "申請ステータス": {
                                                value: "調査中"
                                            },
                                            "判定結果詳細": {
                                                value: judge_detail + "\n\n" + date2 + "\nステータスを調査中に変更。(" + kintone.getLoginUser().name + ")",
                                            }
                                        },
                                    }
                                    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', change_api, function (resp) {
                                        //success
                                        Swal.fire({
                                            title: "操作完了",
                                            text: "審査ステータスを「調査中」に変更しました",
                                            icon: "success"
                                        }).then(function () {
                                            location.reload();
                                        })
                                    })
                                } else {
                                    //console.log(val)
                                    Swal.fire({
                                        title: "処理キャンセル(HO-UI-XX-9999)",
                                        text: "処理をキャンセルしました",
                                        icon: "success"
                                    }).then(function () {
                                        return false;
                                    })
                                }
                            })
                        } else {
                            //不一致
                            Swal.fire({
                                title: "認証エラー(ST-HO-AT-1001)",
                                html: "認証できませんでした<br>管理者にご確認ください",
                                icon: "error"
                            })
                            return false;
                        }
                    }
                })
            }
        })
        header1.appendChild(button1);

        const header2 = kintone.app.record.getSpaceElement('btn_ng');
        const button2 = new Kuc.Button({
            text: '否決にする',
            type: 'submit'
        });
        button2.addEventListener('click', event => {
            var record = kintone.app.record.get().record;
            var status = record["申請ステータス"].value;
            var judge_detail = record["判定結果詳細"].value;
            const youbi = ["日", "月", "火", "水", "木", "金", "土"];

            const date1 = new Date();
            const date2 = date1.getFullYear() + "年" + (date1.getMonth() + 1) + "月" + date1.getDate() + "日" + youbi[date1.getDay()] + "曜日" + date1.getHours() + "時" + date1.getMinutes() + "分" + date1.getSeconds() + "秒"

            if (status != "審査中" && status != "調査中") {
                Swal.fire({
                    title: "条件エラー(ST-HO-FL-3001)",
                    html: "ご指定の操作はできません。<br>管理者にご確認ください",
                    icon: "error"
                })
                return false;
            } else {
                //判定
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
                            //合致した場合
                            Swal.fire({
                                title: "変更確認(ST-HO-AD-1000)",
                                html: '申請ステータスを「<font color="red"><b>否決</b></font>」に変更します。<br>よろしいですか？',
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonText: 'はい',
                                cancelButtonText: 'いいえ'
                            }).then(function (val) {
                                if (val.value) {
                                    console.log("OK");
                                    //APIで変更処理する
                                    var change_api = {
                                        "app": kintone.app.getId(),
                                        "id": kintone.app.record.getId(),
                                        "record": {
                                            "申請ステータス": {
                                                value: "NG"
                                            },
                                            "判定結果詳細": {
                                                value: judge_detail + "\n\n" + date2 + "\nステータスをNGに変更。(" + kintone.getLoginUser().name + ")",
                                            }
                                        },
                                    }
                                    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', change_api, function (resp) {
                                        //success
                                        Swal.fire({
                                            title: "操作完了",
                                            text: "審査ステータスを「NG」に変更しました",
                                            icon: "success"
                                        }).then(function () {
                                            location.reload();
                                        })
                                    })
                                } else {
                                    Swal.fire({
                                        title: "処理キャンセル(HO-UI-XX-9999)",
                                        text: "停止処理をキャンセルしました",
                                        icon: "success"
                                    }).then(function () {
                                        return false;
                                    })
                                }
                            })
                        } else {
                            //不一致
                            Swal.fire({
                                title: "認証エラー(ST-HO-AT-1001)",
                                html: "認証できませんでした<br>管理者にご確認ください",
                                icon: "error"
                            })
                            return false;
                        }
                    }
                })
            }
        })
        header2.appendChild(button2);

        const header3 = kintone.app.record.getSpaceElement('btn_turnback');
        const button3 = new Kuc.Button({
            text: '差し戻す',
            type: 'submit'
        });
        button3.addEventListener('click', event => {
            var record = kintone.app.record.get().record;
            var status = record["申請ステータス"].value;
            var judge_detail = record["判定結果詳細"].value;
            const youbi = ["日", "月", "火", "水", "木", "金", "土"];
            const date1 = new Date();
            const date2 = date1.getFullYear() + "年" + (date1.getMonth() + 1) + "月" + date1.getDate() + "日" + youbi[date1.getDay()] + "曜日" + date1.getHours() + "時" + date1.getMinutes() + "分" + date1.getSeconds() + "秒"

            if (status != "審査中" && status != "調査中") {
                Swal.fire({
                    title: "条件エラー(ST-HO-FL-3001)",
                    html: "ご指定の操作はできません。<br>管理者にご確認ください",
                    icon: "error"
                })
                return false;
            } else {
                Swal.fire({
                    title: "権限者認証(ST-HO-AT-9999)",
                    html: "この操作には認証が必要です。<br>パスワードを入力してください",
                    input: "password",
                    showCancelButton: true,
                    confirmButtonText: "認証",
                    cancelButtonText: "キャンセル"
                }).then(function (result_arr) {
                    var result = result_arr.value
                    if (!result) {
                        //何もしないでreturn
                        return false;
                    } else {
                        if (result === "00777111") {
                            //パス合致
                            Swal.fire({
                                title: "変更確認(ST-HO-AD-1000)",
                                html: '申請ステータスを「<font color="red"><b>差戻</b></font>」に変更します。<br>よろしいですか？',
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonText: 'はい',
                                cancelButtonText: 'いいえ'
                            }).then(function (val) {
                                if (val.value) {
                                    //差戻理由を選択
                                    Swal.fire({
                                        title: "差戻理由入力(HO-CS-DF-4034)",
                                        text: "差戻理由を入力してください。",
                                        input: "textarea",
                                        showCancelButton: true,
                                        confirmButtonText: 'OK',
                                        cancelButtonText: '中止'
                                    }).then(function (reason) {
                                        console.log(reason);
                                        if (!reason.value) {
                                            //未入力
                                            Swal.fire({
                                                title: "処理キャンセル(HO-CS-XX-9999)",
                                                html: "処理を中止しました。<br>尚、差戻理由に関しては必ず入力する必要があります。",
                                                icon: 'success'
                                            })
                                            return false;
                                        } else {
                                            Swal.fire({
                                                title: "確認(HO-CS-DF-5439)",
                                                html: "次の内容で、差戻を行います。<br>よろしいですか？<br><br>【差戻理由】<br>" + reason.value,
                                                icon: "warning",
                                                showCancelButton: true,
                                                confirmButtonText: 'はい',
                                                cancelButtonText: 'いいえ'
                                            }).then(function (yn1) {
                                                if (!yn1.value) {
                                                    //いいえ
                                                    Swal.fire({
                                                        title: "処理キャンセル(HO-CS-XX-9999)",
                                                        html: "処理を中止しました。",
                                                        icon: 'success'
                                                    })
                                                    return false;
                                                } else {
                                                    //差戻理由を登録して、ステータスを差戻に変更
                                                    var change_api = {
                                                        "app": kintone.app.getId(),
                                                        "id": kintone.app.record.getId(),
                                                        "record": {
                                                            "申請ステータス": {
                                                                value: "差戻"
                                                            },
                                                            "判定結果詳細": {
                                                                value: judge_detail + "\n\n" + date2 + "\nステータスを差戻に変更。(" + kintone.getLoginUser().name + ")",
                                                            },
                                                            "差戻理由": {
                                                                value: reason.value,
                                                            }
                                                        },
                                                    }
                                                    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', change_api, function (resp) {
                                                        //success
                                                        Swal.fire({
                                                            title: "操作完了",
                                                            text: "審査ステータスを「差戻」に変更しました",
                                                            icon: "success"
                                                        }).then(function () {
                                                            location.reload();
                                                        })
                                                    })
                                                }
                                            })
                                        }
                                    })
                                } else {
                                    Swal.fire({
                                        title: "処理キャンセル(HO-CS-XX-9999)",
                                        text: "処理を中止しました。",
                                        icon: 'success'
                                    })
                                    return false;
                                }
                            })
                        }
                    }
                })
            }
        })
        header3.appendChild(button3);

        const header4 = kintone.app.record.getSpaceElement('btn_accept');
        const button4 = new Kuc.Button({
            text: '承認する',
            type: 'submit'
        });
        button4.addEventListener('click', event => {
            var record = kintone.app.record.get().record;
            var category = record['申請項目'].value;
            var application_user_id = record['申請者ID'].value;
            var old_name = record['申請者名義'].value;
            var use_date = record['利用日'].value;
            var amount = record['按分対象額'].value;
            var place = record['加盟店名'].value;
            var authory_id = record['管理番号'].value;
            var status = record["申請ステータス"].value;
            var pay_category = record['購入カテゴリ'].value;
            const youbi = ["日", "月", "火", "水", "木", "金", "土"];
            const date1 = new Date();
            const date2 = date1.getFullYear() + "年" + (date1.getMonth() + 1) + "月" + date1.getDate() + "日" + youbi[date1.getDay()] + "曜日" + date1.getHours() + "時" + date1.getMinutes() + "分" + date1.getSeconds() + "秒"
            if (status != "審査中" && status != "調査中") {
                Swal.fire({
                    title: "条件エラー(ST-HO-FL-3001)",
                    html: "ご指定の操作はできません。<br>管理者にご確認ください",
                    icon: "error"
                })
                return false;
            }
            Swal.fire({
                title: "権限者認証(ST-HO-AT-9999)",
                html: "この操作には認証が必要です。<br>パスワードを入力してください",
                input: "password",
                showCancelButton: true,
                confirmButtonText: "認証",
                cancelButtonText: "キャンセル"
            }).then(function (result_arr) {
                var result = result_arr.value
                if (!result) {
                    //何もしないでreturn
                    return false;
                } else {
                    if (result === "00777111") {
                        //申請項目が、按分申請のときは明細を人数分作るため、GID検索 > billm
                        //ただし、請求申請の時は、一回のみ処理のため、billmをする
                        if (category === "按分申請") {
                            //GID取得
                            var group_id = record['按分グループID'].value;
                            if (!group_id) {
                                //記載なし
                                Swal.fire({
                                    title: "事前判定エラー(CA-BT-42)",
                                    text: "按分グループIDを確認してください",
                                    icon: "error"
                                })
                                return false;
                            } else {
                                //記載あり
                                var check_groupid = {
                                    "app": "30",
                                    "query": '管理コード="' + group_id + '"'
                                };

                                return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', check_groupid).then(function (resp1) {
                                    if (!resp1.records.length) {
                                        //該当なし
                                        return new kintone.Promise(function (resolve2, reject2) {
                                            Swal.fire({
                                                title: "入力エラー(CA-BT-42)",
                                                text: "按分グループIDの該当がありません。",
                                                icon: "error"
                                            })
                                            resolve2(false);
                                        })
                                    } else {
                                        //GID該当あり
                                        var user_count = resp1.records["0"]["会員一覧"].value.length;
                                        var divide = Math.ceil(amount / user_count);
                                        //入力したGIDで再度計算する
                                        return new kintone.Promise(function (resolve1, reject1) {
                                            //確認プロンプト
                                            Swal.fire({
                                                title: "登録前確認(HO-CS-DV-0689)",
                                                html: '以下の情報で登録します。よろしいですか？<br><font color="red"><b>この処理を行うと即時登録されます</b></font><br>・按分対象額：' + amount + '円<br>・按分人数：' + user_count + '人<br>・1人当たりの請求額：' + divide + '円',
                                                icon: "warning",
                                                showCancelButton: true,
                                                confirmButtonText: 'はい',
                                                cancelButtonText: 'いいえ'
                                            }).then(function (btn1_arr) {
                                                var btn1 = btn1_arr.value
                                                if (!btn1) {
                                                    Swal.fire({
                                                        title: "処理キャンセル(HO-CS-XX-9999)",
                                                        text: "処理を中止しました。",
                                                        icon: 'success'
                                                    }).then(function () {
                                                        resolve1();
                                                    })
                                                } else if (btn1) {
                                                    //処理続行
                                                    /*事前検証手順
                                                    1. ユーザID検索 => 該当なし => ERROR
                                                    2. ユーザID検索 => 申請者相違 => プロンプト
                                                    3. 与信規定値 => オーバー => プロンプト
                                                    4. 分割規定値 => オーバー => プロンプト
                                                    */
                                                    var sw = 0;
                                                    var sw_msg = "";
                                                    var api = {
                                                        "app": '20',
                                                        "query": '会員番号="' + application_user_id + '"'
                                                    }
                                                    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', api).then(function (resp2) {
                                                        //取得
                                                        if (!resp2.records.length) {
                                                            //対象なし
                                                            var er = {
                                                                title: "事前検証エラー(HO-CS-ER-1001)",
                                                                html: "検証中にエラーが起きました。<br>・申請者ID該当なし",
                                                                icon: "error"
                                                            }
                                                            Swal.fire(er);
                                                            resolve1(false);
                                                        } else {
                                                            //該当あり
                                                            var new1 = resp2.records["0"];
                                                            var new_name = new1["氏"]["value"] + "　" + new1["名"]["value"];
                                                            if (old_name != new_name) {
                                                                //氏名相違
                                                                sw = 1;
                                                                sw_msg = "・当初の申請者から変更されています<br>"
                                                            }
                                                            if (amount > 30000) {
                                                                //与信規定値
                                                                sw = 1;
                                                                sw_msg = sw_msg + "・按分対象額が規定値を超えています<br>"
                                                            }
                                                            if (divide > 10000) {
                                                                //分割規定値
                                                                sw = 1;
                                                                sw_msg = sw_msg + "・1人当たりの金額が規定値を超えています"
                                                            }
                                                        }
                                                        if (sw === 1) {
                                                            //確認
                                                            Swal.fire({
                                                                title: "最終確認(HO-CS-MS-9310)",
                                                                html: "次の項目で確認が発生しています。以下の内容でよろしいですか？<br>" + sw_msg,
                                                                icon: "warning",
                                                                showCancelButton: true,
                                                                confirmButtonText: 'はい',
                                                                cancelButtonText: 'いいえ'
                                                            }).then(function (bt_arr) {
                                                                var bt = bt_arr;
                                                                if (!bt) {
                                                                    Swal.fire({
                                                                        title: "処理キャンセル(HO-CS-XX-9999)",
                                                                        text: "処理を中止しました。",
                                                                        icon: 'success'
                                                                    }).then(function () {
                                                                        resolve1();
                                                                    })
                                                                } else if (bt) {
                                                                    //登録実行
                                                                    //繰り返し処理が必要
                                                                    var user_id = "";
                                                                    var ref_place = "△返金△ " + place;
                                                                    var ref_amount = -divide * (user_count - 1);
                                                                    const billmake = (step) => {
                                                                        return new Promise(resolve => {
                                                                            //Promise処理をする内容を記載する
                                                                            /*
                                                                            bm_user_id -> 会員番号
                                                                            bm_authory_id -> 申請書番号
                                                                            bm_use_date -> 利用日
                                                                            bm_category -> 請求種別(按分請求・立替請求)
                                                                            bm_shop -> 加盟店名
                                                                            bm_amount -> 利用額
                                                                            */
                                                                            user_id = resp1.records["0"]["会員一覧"]["value"][step]["value"]["会員番号"]["value"];
                                                                            if (user_id === application_user_id) {
                                                                                //一致しているときは返金処理を行う
                                                                                bill_make2(user_id, authory_id, use_date, "按分請求", ref_place, ref_amount);
                                                                            } else {
                                                                                bill_make2(user_id, authory_id, use_date, "按分請求", place, divide);
                                                                            }
                                                                            resolve();
                                                                        })
                                                                    }
                                                                    async function bill_m() {
                                                                        for (var i = 0; i < user_count; i++) {
                                                                            console.log(i + "回目")
                                                                            const res = await billmake(i);
                                                                            console.log(res);
                                                                        }
                                                                    }
                                                                    bill_m();
                                                                    var judge_detail = record["判定結果詳細"].value
                                                                    var judge_dtl = judge_detail + "\n\n" + date2 + "\n◆手動審査◆\n結果：OK\nカテゴリ:" + pay_category + "\n審査担当者:" + kintone.getLoginUser().name;
                                                                    return pause_auth(event, "登録済", "判定OK", judge_dtl, application_user_id, group_id, divide, user_count).then(function (data) {
                                                                        //成功
                                                                        console.log(data);
                                                                        //resolve(data);
                                                                        //resolve3(data);
                                                                        return data;
                                                                    }, function (e) {
                                                                        Swal.fire(e.er);
                                                                    }).then(function () {
                                                                        Swal.fire({
                                                                            title: "操作完了",
                                                                            text: "審査を完了しました。",
                                                                            icon: "success"
                                                                        }).then(function () {
                                                                            location.reload();
                                                                        })
                                                                    })
                                                                }
                                                            })
                                                        } else {
                                                            //登録実行
                                                            //繰り返し処理が必要
                                                            var user_id = "";
                                                            var ref_place = "△返金△ " + place;
                                                            var ref_amount = -divide * (user_count - 1);
                                                            const billmake = (step) => {
                                                                return new Promise(resolve => {
                                                                    //Promise処理をする内容を記載する
                                                                    /*
                                                                    bm_user_id -> 会員番号
                                                                    bm_authory_id -> 申請書番号
                                                                    bm_use_date -> 利用日
                                                                    bm_category -> 請求種別(按分請求・立替請求)
                                                                    bm_shop -> 加盟店名
                                                                    bm_amount -> 利用額
                                                                    */
                                                                    user_id = resp1.records["0"]["会員一覧"]["value"][step]["value"]["会員番号"]["value"];
                                                                    if (user_id === application_user_id) {
                                                                        //一致しているときは返金処理を行う
                                                                        bill_make2(user_id, authory_id, use_date, "按分請求", ref_place, ref_amount);
                                                                    } else {
                                                                        bill_make2(user_id, authory_id, use_date, "按分請求", place, divide);
                                                                    }
                                                                    resolve();
                                                                })
                                                            }
                                                            async function bill_m() {
                                                                for (var i = 0; i < user_count; i++) {
                                                                    console.log(i + "回目")
                                                                    const res = await billmake(i);
                                                                    console.log(res);
                                                                }
                                                            }
                                                            bill_m();
                                                            var judge_detail = record["判定結果詳細"].value
                                                            var judge_dtl = judge_detail + "\n\n" + date2 + "\n◆手動審査◆\n結果：OK\nカテゴリ:" + pay_category + "\n審査担当者:" + kintone.getLoginUser().name;
                                                            return pause_auth(event, "登録済", "判定OK", judge_dtl, application_user_id, group_id, divide, user_count).then(function (data) {
                                                                //成功
                                                                console.log(data);
                                                                //resolve(data);
                                                                //resolve3(data);
                                                                return data;
                                                            }, function (e) {
                                                                Swal.fire(e.er);
                                                            }).then(function () {
                                                                Swal.fire({
                                                                    title: "操作完了",
                                                                    text: "審査を完了しました。",
                                                                    icon: "success"
                                                                }).then(function () {
                                                                    location.reload();
                                                                })
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                        })
                                    }
                                })
                            }
                        } else if (category === "請求申請") {
                            //申請内容が正しいものかを確認して、処理
                            var bill_id = record['請求先ID'].value;
                            var api = {
                                "app": '20',
                                "query": '会員番号="' + bill_id + '"'
                            }
                            return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', api).then(function (resp2) {
                                if (!resp2.records.length) {
                                    //対象なし
                                    var er = {
                                        title: "事前検証エラー(HO-CS-ER-1001)",
                                        html: "検証中にエラーが起きました。<br>・請求先ID該当なし",
                                        icon: "error"
                                    }
                                    Swal.fire(er)
                                    return false;
                                } else {
                                    var new1_a = resp2.records["0"];
                                    var new_name = new1_a["氏"]["value"] + new1_a["名"]["value"];
                                    const numberWithComma = new Intl.NumberFormat();
                                    const canma = numberWithComma.format(amount);
                                    var confirm_html = `
                                    以下の内容で、登録を行います。<br>よろしいですか？<br><br>
                                    <p style="text-align: left">
                                    ・申請者(返金対象者)：<b> `+ old_name + `</b><br>
                                    ・請求先名義： <b>`+ new_name + `</b><br>
                                    ・加盟店名： <b>`+ place + `</b><br>
                                    ・請求金額： <b>`+ canma + `円</b>
                                    </p>
                                    `
                                    Swal.fire({
                                        title: "登録前確認(ST-HO-CS-9008)",
                                        html: confirm_html,
                                        icon: "warning",
                                        showCancelButton: true,
                                        confirmButtonText: 'はい',
                                        cancelButtonText: 'いいえ'
                                    }).then(function (btn1_arr) {
                                        var btn1 = btn1_arr.value
                                        if (!btn1) {
                                            //いいえ
                                            Swal.fire({
                                                title: "処理キャンセル(HO-CS-XX-9999)",
                                                text: "処理を中止しました。",
                                                icon: 'success'
                                            })
                                            return false;
                                        } else {
                                            //申請
                                            console.log("処理開始...");
                                            var e_time = new Date();
                                            const start_time = e_time.getTime();
                                            /*billmakeの関数：bm_user_id, bm_authory_id, bm_use_date, bm_category, bm_shop, bm_amount
                                            bm_user_id -> 会員番号
                                            bm_authory_id -> 申請書番号
                                            bm_use_date -> 利用日
                                            bm_category -> 請求種別(按分請求・立替請求)
                                            bm_shop -> 加盟店名
                                            bm_amount -> 利用額
                                            */
                                            return new Promise(resolve => {
                                                //1. 請求作成
                                                bill_make2(bill_id, authory_id, use_date, "立替請求", place, amount);
                                                resolve();
                                            }).then(function () {
                                                return new Promise(resolve => {
                                                    var ref_place = "△返金△ " + place;
                                                    var ref_amount = -amount
                                                    bill_make2(application_user_id, authory_id, use_date, "立替請求", ref_place, ref_amount);
                                                    resolve();
                                                })
                                            }).then(function () {
                                                return new Promise(resolve => {
                                                    var judge_detail = record["判定結果詳細"].value
                                                    var judge_dtl = judge_detail + "\n\n" + date2 + "\n◆手動審査◆\n結果：OK\nカテゴリ:" + pay_category + "\n審査担当者:" + kintone.getLoginUser().name;
                                                    //pause_auth_kojin2(ev1_sub, fp_status, fp_jijen, fp_ju_dtl, fp_app_id, fp_bill_id(請求者), fp_amount)
                                                    return pause_auth_kojin2(event, "登録済", "判定OK", judge_dtl, application_user_id, bill_id, amount).then(function (data) {
                                                        //成功
                                                        console.log(data);
                                                        //resolve(data);
                                                        //resolve3(data);
                                                        return data;
                                                    }, function (e) {
                                                        Swal.fire(e.er);
                                                    }).then(function () {
                                                        const end_time = e_time.getTime();
                                                        var diff_time = end_time - start_time;
                                                        console.log("処理完了(処理時間:" + diff_time + "ミリ秒)")
                                                        Swal.fire({
                                                            title: "操作完了",
                                                            text: "審査を完了しました。",
                                                            icon: "success"
                                                        }).then(function () {
                                                            location.reload();
                                                        })
                                                    })
                                                })
                                            })
                                        }
                                    })
                                }
                            })
                        }
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
        })
        header4.appendChild(button4);

        const header5 = kintone.app.record.getSpaceElement('btn_billdel_0');
        const button5 = new Kuc.Button({
            text: '再審査を行う',
            type: 'alert'
        });
        button5.addEventListener('click', event => {
            //再審査のため、請求レコードから情報を抹消
            //ただし、権限者に限るためパスワードを入力後処理を行う
            var record = kintone.app.record.get().record;
            var status = record["申請ステータス"].value;
            var judge_detail = record["判定結果詳細"].value;
            const youbi = ["日", "月", "火", "水", "木", "金", "土"];

            const date1 = new Date();
            const date2 = date1.getFullYear() + "年" + (date1.getMonth() + 1) + "月" + date1.getDate() + "日" + youbi[date1.getDay()] + "曜日" + date1.getHours() + "時" + date1.getMinutes() + "分" + date1.getSeconds() + "秒"

            if (status != "登録済") {
                //登録済以外の場合はエラー表示
                Swal.fire({
                    title: "条件エラー(ST-HO-FL-3001)",
                    html: "ご指定の操作はできません。<br>管理者にご確認ください",
                    icon: "error"
                })
                return false;
            } else {
                //それ以外の場合
                Swal.fire({
                    title: "権限者認証(ST-HO-AT-9999)",
                    html: "この操作には認証が必要です<br>パスワードを入力してください",
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
                            //合致した場合
                            Swal.fire({
                                title: "変更確認(ST-HO-AD-1000)",
                                html: '申請ステータスを「審査中」に変更します。<br><font color="red"><b>この操作を行うと、現在請求している明細を削除し、オーソリを解除します。</b></font><br>よろしいですか？',
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonText: 'はい',
                                cancelButtonText: 'いいえ'
                            }).then(function (val_arr) {
                                var val = val_arr.value
                                if (val) {
                                    console.log("OK");
                                    //APIで変更処理する
                                    var change_api = {
                                        "app": kintone.app.getId(),
                                        "id": kintone.app.record.getId(),
                                        "record": {
                                            "申請ステータス": {
                                                value: "審査中"
                                            },
                                            "判定結果詳細": {
                                                value: judge_detail + "\n\n" + date2 + "\nステータスを審査中[再審査]に変更。(" + kintone.getLoginUser().name + ")",
                                            }
                                        },
                                    }
                                    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', change_api, function (resp) {
                                        //次に、レコードの削除を処理する
                                        var list_record_api = {
                                            "app": '28',
                                            "query": '依頼書番号="' + record['管理番号'].value + '"'
                                        }
                                        return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', list_record_api, function (q_1) {
                                            console.log(q_1);
                                            var cont = Object.keys(q_1.records).length;
                                            const bill_del = (step) => {
                                                return new Promise(resolve => {
                                                    //stepには削除するデータのレコードIDの配列をぶちこむ
                                                    console.log(step);
                                                    var d_l = {
                                                        "app": '28',
                                                        "ids": step
                                                    }
                                                    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'DELETE', d_l, function (q) {
                                                        //完了
                                                        resolve();
                                                    })
                                                })
                                            }

                                            const pay_lim_change = (uid, c_minus) => {
                                                //レコードID取得
                                                return new Promise(resolve => {
                                                    var json1 = {
                                                        "app": '20',
                                                        "query": '会員番号="' + uid + '"'
                                                    }
                                                    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', json1, function (j1) {
                                                        console.log(j1)
                                                        var record_id_20 = j1.records["0"]["レコード番号"]["value"];
                                                        var old_lim = Number(j1.records["0"]["総合利用額"]["value"]);
                                                        var cm = Number(c_minus);
                                                        var new_lim = old_lim - cm;
                                                        var json2 = {
                                                            "app": '20',
                                                            "id": record_id_20,
                                                            "record": {
                                                                "総合利用額": {
                                                                    "value": new_lim
                                                                }
                                                            }
                                                        }
                                                        return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', json2, function (j2) {
                                                            //総合枠OK
                                                            console.log(j2);
                                                            resolve();
                                                        }, function (e) {
                                                            console.log(e);
                                                            return false;
                                                        })
                                                    }, function (e) {
                                                        console.log(e);
                                                        return false;
                                                    })
                                                })
                                            }

                                            let arr = [];
                                            var record_id = "";
                                            var user_rec_id = "";
                                            var minus_div = "";
                                            async function rec_del() {
                                                for (var i = 0; i < cont; i++) {
                                                    console.log(i);
                                                    record_id = q_1.records[i].レコード番号.value
                                                    user_rec_id = q_1.records[i].会員番号.value
                                                    minus_div = q_1.records[i].請求額.value;
                                                    //minus_div = -minus_div;
                                                    arr.push(record_id)
                                                    await pay_lim_change(user_rec_id, minus_div);
                                                }
                                                await bill_del(arr);
                                            }
                                            rec_del();
                                            Swal.fire({
                                                title: "操作完了",
                                                text: "審査ステータスを「審査中」に変更しました",
                                                icon: "success"
                                            }).then(function () {
                                                location.reload();
                                            })

                                        })
                                    })
                                } else {
                                    Swal.fire({
                                        title: "処理キャンセル(HO-UI-XX-9999)",
                                        text: "停止処理をキャンセルしました",
                                        icon: "success"
                                    }).then(function () {
                                        return false;
                                    })
                                }
                            })
                        } else {
                            //不一致
                            Swal.fire({
                                title: "認証エラー(ST-HO-AT-1001)",
                                text: "認証できませんでした\n管理者にご確認ください",
                                icon: "error"
                            })
                            return false;
                        }
                    }
                })
            }
        })
        header5.appendChild(button5);

        const header6 = kintone.app.record.getSpaceElement('btn_mask_unlock');
        const button6 = new Kuc.Button({
            text: 'マスク解除',
            type: 'alert'
        });
        button6.addEventListener('click', event => {
            Swal.fire({
                title: "権限者認証(ST-HO-AT-9999)",
                html: "この操作には認証が必要です<br>パスワードを入力してください",
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
                        //認証
                        Swal.fire({
                            title: "確認(ST-HO-UM-1000)",
                            html: '非表示の項目を表示します。<br>よろしいですか？',
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonText: 'はい',
                            cancelButtonText: 'いいえ'
                        }).then(function (val_arr) {
                            if (!val_arr.value) {
                                //valなし
                                Swal.fire({
                                    title: "処理キャンセル(HO-UI-XX-9999)",
                                    text: "停止処理をキャンセルしました",
                                    icon: "success"
                                }).then(function () {
                                    return false;
                                })
                            } else {
                                //ok
                                var invisible_field = [
                                    '事前判定結果',
                                    '判定結果詳細',
                                    '申請者名義',
                                    '請求先名義',
                                    '按分人数',
                                    '請求額_1人当たり'
                                ];

                                $.each(invisible_field, function (i, val) {
                                    kintone.app.record.setFieldShown(val, true);
                                })

                                Swal.fire({
                                    title: "操作完了",
                                    text: "マスク表示を解除しました。",
                                    icon: "success"
                                }).then(function () {
                                    return event;
                                })
                            }
                        })
                    } else {
                        Swal.fire({
                            title: "認証エラー(ST-HO-AT-1001)",
                            text: "認証できませんでした\n管理者にご確認ください",
                            icon: "error"
                        })
                        return false;
                    }
                }
            })
        })
        header6.appendChild(button6);
        return event;
    });
})();