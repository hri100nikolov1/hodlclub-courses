import Link from 'next/link'

export const metadata = {
  title: 'Политика за поверителност — HODLClub',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 hover:underline text-sm font-medium">
            ← Обратно
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Политика за поверителност</h1>
          <p className="text-gray-500 text-sm mb-8">Последна актуализация: май 2026 г.</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Кой сме ние</h2>
              <p>
                HODLClub е онлайн образователна платформа, предоставяща курсове в областта на
                криптовалутите и блокчейн технологиите. Курсовете са само и единствено с
                образователна цел и нищо от казаното в уроците не е финансов съвет. Платформата
                се управлява от физическо или юридическо лице, базирано в Република България.
              </p>
              <p className="mt-2">
                За въпроси, свързани с личните ви данни, можете да се свържете с нас на:{' '}
                <strong>info@hodlclub.bg</strong>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Какви данни събираме</h2>
              <p>При регистрация и използване на платформата събираме следните лични данни:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Имейл адрес</strong> — за идентификация и достъп до акаунта</li>
                <li><strong>Имe</strong> — за персонализиране на преживяването</li>
                <li><strong>Парола</strong> — съхранявана изключително в хеширан (нечетим) вид</li>
                <li><strong>Прогрес в курсовете</strong> — завършени уроци и модули</li>
                <li><strong>Дата и час на регистрация</strong></li>
              </ul>
              <p className="mt-3">
                Ние <strong>не събираме</strong> финансова информация, ЕГН, адрес или телефонен
                номер. Не използваме проследяващи бисквитки или рекламни мрежи.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Защо събираме тези данни</h2>
              <p>Данните се събират единствено за следните цели:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Предоставяне на достъп до закупените курсове</li>
                <li>Запазване на прогреса ви в обучението</li>
                <li>Сигурност на акаунта (предотвратяване на неоторизиран достъп)</li>
                <li>Техническа поддръжка при необходимост</li>
              </ul>
              <p className="mt-3">
                Ние <strong>не продаваме, не споделяме и не предоставяме</strong> личните ви данни
                на трети страни за маркетингови или други цели.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Правно основание (GDPR)</h2>
              <p>
                Обработваме личните ви данни на основание <strong>чл. 6(1)(б) от GDPR</strong> —
                изпълнение на договор (предоставяне на закупената услуга), и{' '}
                <strong>чл. 6(1)(а)</strong> — изрично съгласие, дадено при регистрация.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Колко дълго пазим данните</h2>
              <p>
                Личните ви данни се съхраняват докато имате активен акаунт в платформата. При
                изтриване на акаунта всички ваши данни се изтриват незабавно и необратимо от
                нашите сървъри.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Вашите права</h2>
              <p>Съгласно GDPR имате следните права:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  <strong>Право на достъп</strong> — можете да поискате информация за данните,
                  които съхраняваме за вас
                </li>
                <li>
                  <strong>Право на коригиране</strong> — можете да поискате поправка на неточни данни
                </li>
                <li>
                  <strong>Право на изтриване ("право да бъдеш забравен")</strong> — можете да
                  изтриете акаунта си по всяко време от Настройки → Изтрий акаунт
                </li>
                <li>
                  <strong>Право на преносимост</strong> — можете да поискате данните си в
                  машинночетим формат
                </li>
                <li>
                  <strong>Право на оттегляне на съгласие</strong> — можете по всяко време да
                  оттеглите съгласието си, което ще доведе до изтриване на акаунта
                </li>
              </ul>
              <p className="mt-3">
                За упражняване на правата си се свържете с нас на <strong>info@hodlclub.bg</strong>.
                Ще отговорим в срок до 30 дни.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Сигурност на данните</h2>
              <p>Прилагаме следните мерки за защита на данните ви:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Паролите се съхраняват изключително в хеширан вид (bcrypt)</li>
                <li>Комуникацията с платформата е криптирана чрез HTTPS/TLS</li>
                <li>Базата данни е защитена и достъпна само за платформата</li>
                <li>Автоматично блокиране при многократни неуспешни опити за вход</li>
                <li>Сесийните токени са криптографски подписани</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Бисквитки (Cookies)</h2>
              <p>
                Платформата използва <strong>единствено технически необходима бисквитка</strong>{' '}
                за управление на сесията ви (за да останете влезли в акаунта). Тя не съдържа
                лични данни и не се използва за проследяване или реклама. Тази бисквитка е
                задължителна за функционирането на платформата.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Трети страни</h2>
              <p>
                Платформата използва следните услуги на трети страни единствено за техническото
                си функциониране:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  <strong>Neon.tech</strong> — хостинг на базата данни (EU регион, съответства
                  на GDPR)
                </li>
                <li>
                  <strong>Vercel</strong> — хостинг на уеб приложението
                </li>
              </ul>
              <p className="mt-2">
                Никакви лични данни не се предоставят на рекламни мрежи, анализни платформи или
                маркетингови инструменти.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Жалби</h2>
              <p>
                Ако смятате, че обработваме данните ви в нарушение на GDPR, имате право да
                подадете жалба до{' '}
                <strong>Комисията за защита на личните данни (КЗЛД)</strong>:{' '}
                <a
                  href="https://www.cpdp.bg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  www.cpdp.bg
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Промени в политиката</h2>
              <p>
                При съществени промени в тази политика ще ви уведомим чрез платформата. Датата
                на последна актуализация е посочена в началото на документа.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
