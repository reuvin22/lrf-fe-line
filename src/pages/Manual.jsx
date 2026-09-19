import React from 'react';
import { Clock, MapPin, Calculator, Users, Car, FileText, Upload, Lock } from 'lucide-react';

function Manual() {
  const sections = [
    {
      icon: Clock,
      title: "入力方法",
      description: `「今日」画面からセグメントをリアルタイムで開始・終了できます。または開始・終了時刻を指定して手動追加も可能です。`
    },
    {
      icon: MapPin,
      title: "セグメント種別",
      description: `移動：現場間の移動。現場：現場での作業（担当現場を選択）。事務所：事務所での管理業務。`
    },
    {
      icon: Calculator,
      title: "残業計算",
      description: `8時間を超えた分は1.25倍で計算されます。休憩時間は総労働時間に基づき自動控除されます。`
    },
    {
      icon: Users,
      title: "人工集計",
      description: `その日に現場セグメントがある場合、該当現場に対して1人工としてカウントされます。`
    },
    {
      icon: Car,
      title: "交通費",
      description: `定期券の交通費は入力不要です。その日に発生した電車・バスなどの都度払い交通費のみ入力してください。`
    },
    {
      icon: FileText,
      title: "外注報告",
      description: `現場リーダーのみが対象です。準委任・請負の両方について個別に報告してください。「一括設定」で同じ時間をまとめて設定できます。`
    },
    {
      icon: Upload,
      title: "書類アップロード",
      description: `領収書や請求書を撮影してアップロードします。カテゴリと現場を正しく選択してください。金額はOCRで自動読み取りされます。`
    },
    {
      icon: Lock,
      title: "締め切り日",
      description: `当月のデータは翌月10日まで編集できます。それ以降はロックされ、閲覧のみとなります。`
    },
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100">
      <div className="bg-white px-5 py-4 border-b">
        <span className="font-semibold text-lg">マニュアル</span>
      </div>
      <div className="p-4 space-y-4">
        {sections.map((section, index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-2xl shadow-sm flex items-start gap-4"
          >
            <div className="bg-green-100 p-3 rounded-xl">
              <section.icon className="text-green-600" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">
                {section.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                {section.description}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default Manual;