(function () {
  "use strict";

  // Скрипт 1: Набор утилит (query/DOM/helpers).
  // Комментарий: общие функции, чтобы не дублировать код по проекту.
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  // Скрипт 2: Центр уведомлений (виджеты-уведомления сверху справа).
  // Комментарий: позволяет показывать много разных уведомлений (успех/ошибка/инфо).
  var notifyRoot = null;
  function ensureNotifyRoot() {
    if (notifyRoot) return notifyRoot;
    notifyRoot = document.createElement("div");
    notifyRoot.className = "notify-center";
    notifyRoot.setAttribute("aria-live", "polite");
    notifyRoot.setAttribute("aria-relevant", "additions");
    document.body.appendChild(notifyRoot);
    return notifyRoot;
  }

  function notify(opts) {
    var root = ensureNotifyRoot();
    var type = (opts && opts.type) || "info";
    var title = (opts && opts.title) || "CyberArena";
    var text = (opts && opts.text) || "";
    var ttl = typeof (opts && opts.ttl) === "number" ? opts.ttl : 4200;

    var card = document.createElement("div");
    card.className = "notify-card notify-card--" + type;
    card.setAttribute("role", "status");

    var h = document.createElement("div");
    h.className = "notify-card__title";
    h.textContent = title;

    var p = document.createElement("p");
    p.className = "notify-card__text";
    p.textContent = text;

    card.appendChild(h);
    card.appendChild(p);
    root.appendChild(card);

    window.setTimeout(function () {
      if (card && card.parentNode) card.parentNode.removeChild(card);
    }, clamp(ttl, 1200, 20000));
  }

  // Скрипт 3: Тост (снизу справа) — оставлен для совместимости.
  // Комментарий: быстрые короткие сообщения, если нужно именно внизу.
  function showToast(message) {
    var existing = qs(".toast");
    if (existing) existing.remove();

    var el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.textContent = message;
    document.body.appendChild(el);

    requestAnimationFrame(function () {
      el.classList.add("is-visible");
    });

    window.setTimeout(function () {
      el.classList.remove("is-visible");
      window.setTimeout(function () {
        el.remove();
      }, 300);
    }, 3200);
  }

  // Скрипт 4: Мобильное меню.
  // Комментарий: открытие/закрытие навигации на узких экранах.
  function initMobileNav() {
    var toggle = qs(".nav-toggle");
    var nav = qs("#site-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    qsa("a", nav).forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 768px)").matches) {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  // Скрипт 5: Обработка форм (поиск/алерты/уведомления).
  // Комментарий: часть форм — через alert, часть — через виджеты, поиск — реальный.
  function initForms() {
    qsa("form").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var isGet = form.method && form.method.toLowerCase() === "get";

        // Поиск на главной: реальные результаты по сайту (локальный индекс).
        var qInput = form.querySelector('input[name="q"]');
        if (isGet && qInput) {
          runSiteSearch(String(qInput.value || ""));
          return;
        }

        // Трансферный хаб (teams.html): вместо виджета — alert.
        if (form.querySelector("#nickname")) {
          alert(getLang() === "en" ? "Your profile has been taken into development." : "Ваша анкета взята в разработку.");
          form.reset();
          return;
        }

        // Заявка на турнир (tournaments.html): alert “форма принята”.
        if (form.querySelector("#team-name") && form.querySelector("#captain-email")) {
          alert(
            getLang() === "en"
              ? "Application accepted. Organizers will contact you."
              : "Форма заявки принята. Организаторы свяжутся с вами."
          );
          form.reset();
          return;
        }

        // Создать новую тему (forum.html): alert.
        if (form.querySelector("#topic-title") && form.querySelector("#topic-text")) {
          alert(getLang() === "en" ? "Topic accepted and sent to moderation (demo)." : "Тема принята и отправлена на модерацию (демо).");
          form.reset();
          return;
        }

        // Остальные формы оставляем как уведомления.
        if (isGet) notify({ type: "info", title: "Поиск", text: "Демо-режим: данные не отправляются." });
        else notify({ type: "success", title: "Форма", text: "Отправка в демо-режиме выполнена." });
      });
    });
  }

  // Скрипт 24: Поиск по сайту на главной странице.
  // Комментарий: простой локальный индекс страниц (без сервера) + вывод результатов под формой.
  var SITE_INDEX = [
    { titleRu: "Главная", titleEn: "Home", url: "index.html", keywords: ["главная", "home", "cyberarena"] },
    { titleRu: "Новости", titleEn: "News", url: "news.html", keywords: ["новости", "news", "интервью", "patch", "патч"] },
    { titleRu: "Команды и игроки", titleEn: "Teams & players", url: "teams.html", keywords: ["команды", "игроки", "teams", "players", "трансфер", "transfer", "анкета"] },
    { titleRu: "Турниры", titleEn: "Tournaments", url: "tournaments.html", keywords: ["турниры", "tournaments", "регистрация", "cup", "заявка"] },
    { titleRu: "Трансляции", titleEn: "Broadcasts", url: "broadcasts.html", keywords: ["трансляции", "стрим", "broadcasts", "twitch", "live", "зрителей"] },
    { titleRu: "Форум", titleEn: "Forum", url: "forum.html", keywords: ["форум", "forum", "тема", "обсуждение", "recruiting"] },
    { titleRu: "Контакты", titleEn: "Contacts", url: "contacts.html", keywords: ["контакты", "contacts", "поддержка", "support", "email"] }
  ];

  function ensureSearchResultsRoot() {
    var root = qs("#search-results");
    if (root) return root;

    root = document.createElement("section");
    root.id = "search-results";
    root.style.marginTop = "1.25rem";
    root.style.padding = "1.15rem 1.25rem";
    root.style.background = "var(--bg-card)";
    root.style.border = "1px solid var(--border)";
    root.style.borderRadius = "var(--radius)";

    var h = document.createElement("h2");
    h.setAttribute("data-i18n", "searchResultsTitle");
    h.style.marginTop = "0";
    h.textContent = getLang() === "en" ? "Search results" : "Результаты поиска";

    var list = document.createElement("div");
    list.className = "search-results__list";

    root.appendChild(h);
    root.appendChild(list);

    var main = qs("#main");
    if (main) main.appendChild(root);
    else document.body.appendChild(root);
    return root;
  }

  function runSiteSearch(query) {
    // Поиск нужен только на главной.
    var isHome = /index/i.test((document.title || "")) || !!qs('form input[name="q"]');
    if (!isHome) return;

    var q = String(query || "").trim().toLowerCase();
    var root = ensureSearchResultsRoot();
    var list = qs(".search-results__list", root);
    if (!list) return;
    list.innerHTML = "";

    if (!q) {
      notify({ type: "info", title: getLang() === "en" ? "Search" : "Поиск", text: getLang() === "en" ? "Type a query." : "Введите запрос." });
      return;
    }

    var lang = getLang();
    var hits = SITE_INDEX.filter(function (item) {
      var hay =
        (item.keywords || []).join(" ").toLowerCase() +
        " " +
        item.titleRu.toLowerCase() +
        " " +
        item.titleEn.toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    if (!hits.length) {
      var p = document.createElement("p");
      p.setAttribute("data-i18n", "searchNoResults");
      p.style.color = "var(--text-muted)";
      p.textContent = lang === "en" ? "No results. Try a different query." : "Ничего не найдено. Попробуй другой запрос.";
      list.appendChild(p);
      return;
    }

    var ul = document.createElement("ul");
    ul.style.margin = "0";
    ul.style.paddingLeft = "1.2rem";
    hits.forEach(function (item) {
      var li = document.createElement("li");
      li.style.marginBottom = "0.35rem";
      var a = document.createElement("a");
      a.href = item.url;
      a.textContent = lang === "en" ? item.titleEn : item.titleRu;
      li.appendChild(a);
      ul.appendChild(li);
    });
    list.appendChild(ul);
  }

  // Скрипт 6: Локализация RU/EN по data-i18n + сохранение выбора.
  // Комментарий: минимальный i18n без библиотек — работает на всех страницах.
  var I18N = {
    ru: {
      skip: "Перейти к контенту",
      siteTitleShort: "CyberArena",
      siteTitleFull: "CyberArena — Киберспортивная платформа",
      navHome: "Главная",
      navNews: "Новости",
      navTeams: "Команды и игроки",
      navTournaments: "Турниры",
      navBroadcasts: "Трансляции",
      navForum: "Форум",
      navContacts: "Контакты",
      langTitle: "Язык",
      searchLabel: "Поиск по сайту:",
      searchBtn: "Найти",
      homeWelcomeTitle: "Добро пожаловать на CyberArena!",
      homeWelcomeText: 'CyberArena — это крупнейшая независимая площадка для отслеживания киберспортивных событий в СНГ. Здесь вы найдете актуальное расписание турниров по <strong>Dota 2, CS2 и VALORANT</strong>, свежую аналитику меты, интервью с топ-игроками и сможете найти команду для участия в любительских лигах.',
      homeScheduleTitle: "Расписание матчей на сегодня",
      homeThTime: "Время (МСК)",
      homeThGame: "Дисциплина",
      homeThTeam1: "Команда 1",
      homeThScore: "Счет",
      homeThTeam2: "Команда 2",
      homeWhatsNewTitle: "Что нового на платформе?",
      homeWhatsNewItem1: "<strong>Открыта регистрация на Spring Amateur Cup 2026</strong> — призовой фонд составляет 100 000 рублей. Подробности в разделе \"Турниры\".",
      homeWhatsNewItem2: "<strong>Обновление форума:</strong> добавлены новые разделы для поиска тренеров и аналитиков.",
      homeWhatsNewItem3: "<strong>Интервью недели:</strong> Читайте эксклюзивное интервью с s1mple в разделе \"Новости\".",
      newsFeedTitle: "Лента новостей",
      newsInterviewsTitle: "Эксклюзивные интервью",
      broadcastsLiveTitle: "Прямой эфир LIVE",
      broadcastsNowPlaying: "Сейчас играет: Team Spirit vs Cloud9 (Карта 2 - Anubis)",
      broadcastsScheduleTitle: "Расписание будущих трансляций",
      broadcastsThDate: "Дата и время",
      broadcastsThStudio: "Студия освещения",
      broadcastsThEvent: "Событие",
      broadcastsThLink: "Ссылка",
      viewersLabel: "Зрителей",
      langLabel: "Язык",
      langRussian: "Русский",
      easterEggTitle: "Пасхалка",
      easterEggText: "sImple goat",
      searchResultsTitle: "Результаты поиска",
      searchNoResults: "Ничего не найдено. Попробуй другой запрос.",
      teamsTransferTitle: "Трансферный хаб: Поиск команды",
      teamsTransferText: "Оставьте свою анкету, если вы ищете стак для турниров или пракков.",
      teamsNickLabel: "Ваш никнейм:",
      teamsGameLabel: "Выберите дисциплину:",
      teamsHoursLabel: "Опыт игры (часов):",
      teamsProfileLabel: "Ссылка на профиль (Faceit / Dotabuff):",
      teamsPublishBtn: "Опубликовать анкету",
      tourApplyTitle: "Форма заявки на турнир",
      tourApplyText: "Внимательно заполните все поля. Связь с капитаном будет происходить через Discord.",
      tourLegendTeam: "Информация о команде",
      tourTeamNameLabel: "Название команды:",
      tourTeamLogoLabel: "Логотип команды:",
      tourRegionLabel: "Регион:",
      tourRegionOptPlaceholder: "-- Выберите регион --",
      tourRegionOptRu: "Россия",
      tourRegionOptBy: "Беларусь",
      tourRegionOptKz: "Казахстан",
      tourRegionOptOther: "Другой",
      tourLegendContacts: "Контактные данные и состав",
      tourEmailLabel: "Email капитана:",
      tourDiscordLabel: "Discord капитана:",
      tourRosterLabel: "Steam-профили всех 5 игроков:",
      tourLegendPolicy: "Политика турнира",
      tourRulesLabel: "С регламентом турнира ознакомлен, обязуемся установить античит Faceit.",
      tourAgeLabel: "Всем участникам команды есть полных 16 лет.",
      tourSubmitBtn: "Отправить заявку организаторам",
      forumCreateTitle: "Создать новую тему",
      forumTopicTitleLabel: "Заголовок темы:",
      forumTopicCategoryLabel: "Категория:",
      forumCatTeam: "Поиск команды",
      forumCatTech: "Технические проблемы",
      forumCatOfftopic: "Оффтоп (Курилка)",
      forumTopicTextLabel: "Текст сообщения:",
      forumPublishBtn: "Опубликовать тему",
      
      // НОВЫЕ КЛЮЧИ
      rankPlace: "Место",
      rankLogo: "Логотип",
      rankName: "Название команды",
      rankPoints: "Очки",
      csWorldRank: "Мировой рейтинг команд (Топ-5 HLTV)",
      csStarPlayers: "Звездные игроки CS2",
      dotaWorldRank: "Мировой рейтинг команд (Топ-5 ESL)",
      dotaStarPlayers: "Звездные игроки Dota 2",
      teamLabel: "Команда:",
      roleLabel: "Роль:",
      roleSniper: "Снайпер (AWP)",
      roleRiflerEntry: "Рифлер (Энтри)",
      roleRifler: "Рифлер",
      roleOfflane: "Оффлейнер (Поз. 3)",
      roleCarry: "Керри (Поз. 1)",
      backToTop: "Наверх к выбору дисциплины ↑",
      descMonesy: "Рейтинг 2.0: <strong style='color: var(--accent);'>1.38</strong>. Один из самых талантливых молодых игроков, мастер клатчей и феноменальной реакции.",
      descDonk: "Рейтинг 2.0: <strong style='color: var(--accent);'>1.45</strong>. Главное открытие года, MVP IEM Katowice 2024, ломающий тайминги самых опытных команд.",
      descNiko: "Рейтинг 2.0: <strong style='color: var(--accent);'>1.19</strong>. Легендарный игрок, обладающий одним из лучших и стабильных аимов в истории игры.",
      descCollapse: "Двукратный чемпион The International. Признанный гений инициации на Magnus и Mars, способный в одиночку перевернуть драку.",
      descYatoro: "Двукратный чемпион TI. Считается одним из лучших керри-игроков в истории Dota 2 благодаря огромному пулу героев и идеальному пониманию макроигры.",
      descDyrachyo: "Победитель множества мейджоров. Отличается сверхагрессивным стилем игры, который создает огромное пространство для остальной команды.",
      tourActual: "Актуальные турниры (Открыта регистрация)",
      tourDisciplineLabel: "Дисциплина:",
      tourFormatLabel: "Формат:",
      tourPrizeLabel: "Призовой фонд:",
      tourDatesLabel: "Даты проведения:",
      tourStatusLabel: "Статус:",
      tourStatusLeft: "Осталось 12 мест",
      tourDesc: "Любительский турнир для команд из СНГ. Участие игроков с профилями HLTV строго запрещено.",
      tourArchive: "Архив завершенных турниров",
      tourThName: "Название турнира",
      tourThWinner: "Победитель",
      tourThMvp: "MVP Турнира",
      news1Title: "Team Spirit становятся чемпионами IEM Katowice!",
      news1Meta: "Опубликовано: <time datetime='2026-02-15'>15 февраля 2026</time> | Автор: <em>Аналитический отдел</em>",
      news1Text: "В гранд-финале турнира в Катовице команда Team Spirit одержала уверенную победу над FaZe Clan со счетом 3:0. Молодой талант donk снова показал невероятный уровень индивидуальной игры, закончив серию с рейтингом 1.62.",
      news1Map1: "Карта 1 (Mirage): 13-9 в пользу Spirit",
      news1Map2: "Карта 2 (Nuke): 13-11 в пользу Spirit",
      news1Map3: "Карта 3 (Overpass): 13-3 в пользу Spirit",
      newsReadMore: "Читать полный разбор матча...",
      news2Title: "Вышел патч 7.35d в Dota 2: Конец эры Chen и Dragon Knight",
      news2Meta: "Опубликовано: <time datetime='2026-02-14'>14 февраля 2026</time> | Автор: <em>IceFrog Fan</em>",
      news2Text: "Valve выпустили долгожданное буквенное обновление. Основной удар пришелся по самым популярным героям прошедшего мейджора. Chen потерял процентное снижение брони на крипах, а Dragon Knight получил существенный нерф врожденной регенерации.",
      news2Quote: "\"Наконец-то мы сможем пикать других героев в сложную линию. Этот патч освежит мету перед грядущими квалификациями\" — прокомментировал капитан команды Entity.",
      news3Title: "M0NESY: \"Мы готовы забирать следующий мажор\"",
      news3Text: "Снайпер команды G2 поделился своими мыслями о текущей форме состава. По его словам, команда провела масштабный буткемп и исправила ошибки в коммуникации, которые мешали им на последних двух турнирах.",
      forumDiscuss: "Обсуждения и патчноуты",
      forumThTopic: "Тема",
      forumThAuthor: "Автор",
      forumThReplies: "Ответов",
      forumThLast: "Последнее сообщение",
      forumTopic1Title: "Обсуждение патча 7.35d (Dota 2)",
      forumTopic1Desc: "Делимся мнением, кто теперь имба патча.",
      forumTopic2Title: "Раскидка смоков на новой карте в CS2",
      forumTopic2Desc: "Собрал лучшие гранаты для защиты А-плента.",
      forumRecruit: "Рекрутинг (Поиск команды)",
      forumThRank: "Ранг/MMR",
      forumThDate: "Дата создания",
      forumRecruit1Title: "Ищу стак для Faceit, роль - IGL/Саппорт",
      forumRecruit2Title: "Команда ищет хардлайнера (pos 3)",
      brdToday: "Сегодня, 21:00",
      brdTomorrow: "Завтра, 14:00",
      brdEvent1: "Dota 2 - DreamLeague (Группы)",
      brdEvent2: "CS2 - BetBoom Dacha (Полуфиналы)",
      brdLinkGo: "Перейти на канал",
      brdLinkRemind: "Установить напоминание",
      contactOrg: "Организаторы",
      contactOrgSub: "Контакты организаторов",
      contactTime: "Время ответа: 10:00–18:00 (МСК)",
      contactAds: "Реклама и сотрудничество",
      contactAdsSub: "Партнерства",
      contactAdsTopics: "Темы: интеграции, спонсорство, медиа и пресс-релизы",
      contactTech: "Техподдержка",
      contactTechSub: "Служба поддержки пользователей",
      contactTechForum: "Раздел «Технические проблемы»"
    },
    en: {
      skip: "Skip to content",
      siteTitleShort: "CyberArena",
      siteTitleFull: "CyberArena — Esports platform",
      navHome: "Home",
      navNews: "News",
      navTeams: "Teams & players",
      navTournaments: "Tournaments",
      navBroadcasts: "Broadcasts",
      navForum: "Forum",
      navContacts: "Contacts",
      langTitle: "Language",
      searchLabel: "Site search:",
      searchBtn: "Search",
      homeWelcomeTitle: "Welcome to CyberArena!",
      homeWelcomeText: "CyberArena is a major independent platform for tracking esports events in the CIS. Here you'll find up‑to‑date tournament schedules for <strong>Dota 2, CS2 and VALORANT</strong>, fresh meta analysis, interviews with top players, and a place to find a team for amateur leagues.",
      homeScheduleTitle: "Today's match schedule",
      homeThTime: "Time",
      homeThGame: "Game",
      homeThTeam1: "Team 1",
      homeThScore: "Score",
      homeThTeam2: "Team 2",
      homeWhatsNewTitle: "What's new on the platform?",
      homeWhatsNewItem1: "<strong>Spring Amateur Cup 2026 registration is open</strong> — prize pool is 100,000 RUB. Details in the “Tournaments” section.",
      homeWhatsNewItem2: "<strong>Forum update:</strong> new sections added for finding coaches and analysts.",
      homeWhatsNewItem3: "<strong>Interview of the week:</strong> Read an exclusive interview with s1mple in “News”.",
      newsFeedTitle: "News feed",
      newsInterviewsTitle: "Exclusive interviews",
      broadcastsLiveTitle: "Live broadcast LIVE",
      broadcastsNowPlaying: "Now playing: Team Spirit vs Cloud9 (Map 2 - Anubis)",
      broadcastsScheduleTitle: "Upcoming broadcasts",
      broadcastsThDate: "Date & time",
      broadcastsThStudio: "Studio",
      broadcastsThEvent: "Event",
      broadcastsThLink: "Link",
      viewersLabel: "Viewers",
      langLabel: "Language",
      langRussian: "Russian",
      easterEggTitle: "Easter egg",
      easterEggText: "sImple goat",
      searchResultsTitle: "Search results",
      searchNoResults: "No results. Try a different query.",
      teamsTransferTitle: "Transfer hub: Looking for a team",
      teamsTransferText: "Leave your profile if you're looking for a stack for tournaments or practice.",
      teamsNickLabel: "Your nickname:",
      teamsGameLabel: "Choose a game:",
      teamsHoursLabel: "Playtime (hours):",
      teamsProfileLabel: "Profile link (Faceit / Dotabuff):",
      teamsPublishBtn: "Submit profile",
      tourApplyTitle: "Tournament application form",
      tourApplyText: "Fill in all fields carefully. We will contact the captain via Discord.",
      tourLegendTeam: "Team info",
      tourTeamNameLabel: "Team name:",
      tourTeamLogoLabel: "Team logo:",
      tourRegionLabel: "Region:",
      tourRegionOptPlaceholder: "-- Select region --",
      tourRegionOptRu: "Russia",
      tourRegionOptBy: "Belarus",
      tourRegionOptKz: "Kazakhstan",
      tourRegionOptOther: "Other",
      tourLegendContacts: "Contacts & roster",
      tourEmailLabel: "Captain email:",
      tourDiscordLabel: "Captain Discord:",
      tourRosterLabel: "Steam profiles of all 5 players:",
      tourLegendPolicy: "Tournament policy",
      tourRulesLabel: "I have read the rules and agree to install Faceit anti-cheat.",
      tourAgeLabel: "All team members are 16+ years old.",
      tourSubmitBtn: "Send application",
      forumCreateTitle: "Create a new topic",
      forumTopicTitleLabel: "Topic title:",
      forumTopicCategoryLabel: "Category:",
      forumCatTeam: "Looking for a team",
      forumCatTech: "Technical issues",
      forumCatOfftopic: "Off-topic",
      forumTopicTextLabel: "Message text:",
      forumPublishBtn: "Publish topic",
      
      // NEW KEYS
      rankPlace: "Rank",
      rankLogo: "Logo",
      rankName: "Team Name",
      rankPoints: "Points",
      csWorldRank: "World Team Ranking (Top-5 HLTV)",
      csStarPlayers: "CS2 Star Players",
      dotaWorldRank: "World Team Ranking (Top-5 ESL)",
      dotaStarPlayers: "Dota 2 Star Players",
      teamLabel: "Team:",
      roleLabel: "Role:",
      roleSniper: "Sniper (AWP)",
      roleRiflerEntry: "Rifler (Entry)",
      roleRifler: "Rifler",
      roleOfflane: "Offlaner (Pos 3)",
      roleCarry: "Carry (Pos 1)",
      backToTop: "Back to discipline selection ↑",
      descMonesy: "Rating 2.0: <strong style='color: var(--accent);'>1.38</strong>. One of the most talented young players, clutch master with phenomenal reaction.",
      descDonk: "Rating 2.0: <strong style='color: var(--accent);'>1.45</strong>. The main discovery of the year, MVP IEM Katowice 2024, breaking timings of the most experienced teams.",
      descNiko: "Rating 2.0: <strong style='color: var(--accent);'>1.19</strong>. Legendary player, possessing one of the best and most stable aims in the game's history.",
      descCollapse: "Two-time The International champion. Recognized genius of initiation on Magnus and Mars, capable of single-handedly turning a fight.",
      descYatoro: "Two-time TI champion. Considered one of the best carry players in Dota 2 history due to a huge hero pool and perfect understanding of macro game.",
      descDyrachyo: "Winner of multiple majors. Distinctive for his hyper-aggressive playstyle, which creates immense space for the rest of the team.",
      tourActual: "Current tournaments (Registration open)",
      tourDisciplineLabel: "Discipline:",
      tourFormatLabel: "Format:",
      tourPrizeLabel: "Prize pool:",
      tourDatesLabel: "Dates:",
      tourStatusLabel: "Status:",
      tourStatusLeft: "12 slots left",
      tourDesc: "Amateur tournament for CIS teams. Participation of players with HLTV profiles is strictly prohibited.",
      tourArchive: "Completed tournaments archive",
      tourThName: "Tournament Name",
      tourThWinner: "Winner",
      tourThMvp: "Tournament MVP",
      news1Title: "Team Spirit become IEM Katowice Champions!",
      news1Meta: "Published: <time datetime='2026-02-15'>Feb 15, 2026</time> | Author: <em>Analytics Department</em>",
      news1Text: "In the Katowice grand final, Team Spirit secured a confident 3:0 victory over FaZe Clan. Young talent donk once again showed an incredible level of individual play, finishing the series with a 1.62 rating.",
      news1Map1: "Map 1 (Mirage): 13-9 for Spirit",
      news1Map2: "Map 2 (Nuke): 13-11 for Spirit",
      news1Map3: "Map 3 (Overpass): 13-3 for Spirit",
      newsReadMore: "Read the full match breakdown...",
      news2Title: "Dota 2 Patch 7.35d Released: End of the Chen and Dragon Knight Era",
      news2Meta: "Published: <time datetime='2026-02-14'>Feb 14, 2026</time> | Author: <em>IceFrog Fan</em>",
      news2Text: "Valve released the highly anticipated letter update. The main hit went to the most popular heroes of the past major. Chen lost his percentage armor reduction on creeps, and Dragon Knight received a significant nerf to his innate regeneration.",
      news2Quote: "\"Finally, we can pick other heroes for the offlane. This patch will refresh the meta before the upcoming qualifiers,\" commented the captain of Entity.",
      news3Title: "M0NESY: \"We are ready to take the next major\"",
      news3Text: "G2's sniper shared his thoughts on the roster's current form. According to him, the team had a massive bootcamp and fixed communication errors that hindered them in the last two tournaments.",
      forumDiscuss: "Discussions and Patch Notes",
      forumThTopic: "Topic",
      forumThAuthor: "Author",
      forumThReplies: "Replies",
      forumThLast: "Last Message",
      forumTopic1Title: "Patch 7.35d Discussion (Dota 2)",
      forumTopic1Desc: "Sharing opinions on who is the meta now.",
      forumTopic2Title: "Smoke lineups on the new CS2 map",
      forumTopic2Desc: "Gathered the best nades for A-site defense.",
      forumRecruit: "Recruiting (Looking for a team)",
      forumThRank: "Rank/MMR",
      forumThDate: "Creation Date",
      forumRecruit1Title: "Looking for a Faceit stack, role - IGL/Support",
      forumRecruit2Title: "Team looking for an offlaner (pos 3)",
      brdToday: "Today, 21:00",
      brdTomorrow: "Tomorrow, 14:00",
      brdEvent1: "Dota 2 - DreamLeague (Group Stage)",
      brdEvent2: "CS2 - BetBoom Dacha (Semifinals)",
      brdLinkGo: "Go to channel",
      brdLinkRemind: "Set reminder",
      contactOrg: "Organizers",
      contactOrgSub: "Organizer Contacts",
      contactTime: "Response time: 10:00–18:00 (MSK)",
      contactAds: "Advertising and Cooperation",
      contactAdsSub: "Partnerships",
      contactAdsTopics: "Topics: integrations, sponsorships, media and press releases",
      contactTech: "Technical Support",
      contactTechSub: "User Support Service",
      contactTechForum: "«Technical issues» section"
    }
  };

  function getLang() {
    var stored = null;
    try {
      stored = window.localStorage ? window.localStorage.getItem("ca_lang") : null;
    } catch (_) {
      stored = null;
    }
    return stored === "en" ? "en" : "ru";
  }

  function applyLang(lang) {
    var dict = I18N[lang] || I18N.ru;
    document.documentElement.setAttribute("lang", lang);

    qsa("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!key) return;
      var value = dict[key];
      if (!value) return;

      // Особый кейс: заголовок с LIVE-бейджом (оставляем span).
      if (key === "broadcastsLiveTitle" && el.querySelector && el.querySelector("span")) {
        var span = el.querySelector("span");
        while (el.firstChild) el.removeChild(el.firstChild);
        var parts = value.split("LIVE");
        el.appendChild(document.createTextNode((parts[0] || "").trim() + " "));
        el.appendChild(span);
        return;
      }

      // Если перевод содержит HTML (например <strong>), применяем как разметку.
      if (typeof value === "string" && value.indexOf("<") !== -1 && value.indexOf(">") !== -1) {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    });

    qsa(".js-lang").forEach(function (a) {
      var aLang = a.getAttribute("data-lang");
      if (aLang === lang) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function setLang(lang) {
    var next = lang === "en" ? "en" : "ru";
    try {
      if (window.localStorage) window.localStorage.setItem("ca_lang", next);
    } catch (_) {}
    applyLang(next);
  }

  function initLangLinks() {
    qsa(".js-lang").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        setLang(link.getAttribute("data-lang") || "ru");
        notify({ type: "info", title: "Language", text: getLang() === "en" ? "English enabled." : "Русский включён." });
      });
    });
  }

  // Скрипт 7: Пасхалка в консоли.
  // Комментарий: “спрятано в консоли” — выводим подсказку и скрытое сообщение.
  function initConsoleEasterEgg() {
    try {
      console.log("%cCyberArena", "color:#00f5ff;font-weight:800;font-size:18px;");
      console.log("%cЕсли ты это читаешь — ты уже нашёл пасхалку.", "color:#ff2d95;font-weight:700;");
      console.log("%cПодсказка: кликни много раз по названию сайта в хедере.", "color:#8b96a8;");
    } catch (_) {}
  }

  // Скрипт 8: Пасхалка по многократному клику на заголовок сайта.
  // Комментарий: после серии кликов показываем уведомление "sImple goat".
  function initHeaderClickEasterEgg() {
    var title = qs(".site-title");
    if (!title) return;

    var clicks = 0;
    var timer = null;
    title.style.cursor = "pointer";

    title.addEventListener("click", function () {
      clicks += 1;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        clicks = 0;
      }, 1200);

      if (clicks >= 7) {
        clicks = 0;
        var lang = getLang();
        notify({ type: "success", title: (I18N[lang] || I18N.ru).easterEggTitle, text: (I18N[lang] || I18N.ru).easterEggText });
      }
    });
  }

  // Скрипт 9: Индикатор прогресса прокрутки страницы.
  // Комментарий: маленькая “линия прогресса” сверху.
  function initScrollProgress() {
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);

    function update() {
      var doc = document.documentElement;
      var scrollTop = doc.scrollTop || document.body.scrollTop || 0;
      var max = (doc.scrollHeight || 1) - (doc.clientHeight || 1);
      var pct = max > 0 ? (scrollTop / max) * 100 : 0;
      bar.style.width = clamp(pct, 0, 100).toFixed(2) + "%";
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  // Скрипт 10: Кнопка “наверх”.
  // Комментарий: появляется при прокрутке, помогает навигации.
  function initBackToTop() {
    var btn = document.createElement("button");
    btn.className = "back-to-top";
    btn.type = "button";
    btn.setAttribute("aria-label", "Наверх");
    btn.textContent = "↑";
    document.body.appendChild(btn);

    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      if (y > 600) btn.classList.add("is-visible");
      else btn.classList.remove("is-visible");
    }

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Скрипт 11: Виджет статуса сети (online/offline).
  // Комментарий: показывает уведомление, если пропал интернет.
  function initNetworkWidget() {
    function report() {
      notify({ type: navigator.onLine ? "success" : "danger", title: "Сеть", text: navigator.onLine ? "Соединение восстановлено." : "Соединение потеряно (offline)." });
    }

    window.addEventListener("online", report);
    window.addEventListener("offline", report);
  }

  // Скрипт 12: Горячие клавиши (Ctrl+K).
  // Комментарий: мини-функция для “живости” интерфейса.
  function initHotkeys() {
    document.addEventListener("keydown", function (e) {
      var isMac = navigator.platform && /Mac/i.test(navigator.platform);
      var mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        notify({ type: "info", title: "Hotkey", text: "Быстрый поиск (демо)." });
      }
    });
  }

  // Скрипт 13: Таймер “время на сайте”.
  // Комментарий: раз в минуту показывает статистику (виджет-уведомление).
  function initTimeOnSite() {
    var start = Date.now();
    var lastMinute = 0;
    window.setInterval(function () {
      var minutes = Math.floor((Date.now() - start) / 60000);
      if (minutes > 0 && minutes !== lastMinute) {
        lastMinute = minutes;
        notify({ type: "info", title: "Статистика", text: "Вы на сайте уже " + minutes + " мин." });
      }
    }, 5000);
  }

  // Скрипт 14: Случайный “совет дня”.
  // Комментарий: показывает подсказку при загрузке страницы.
  function initTipOfTheDay() {
    var tips = [
      "Нажми несколько раз на CyberArena в хедере.",
      "На стримах есть Twitch-вставка и счётчик зрителей.",
      "Ctrl+K — быстрый поиск (демо).",
      "Прокрути вниз — появится кнопка “наверх”."
    ];
    var tip = tips[Math.floor(Math.random() * tips.length)];
    notify({ type: "info", title: "Совет", text: tip, ttl: 5200 });
  }

  // Скрипт 15: Подгрузка внешних скриптов (helper).
  // Комментарий: используем для Twitch embed, чтобы не грузить его на всех страницах.
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("Script load failed: " + src)); };
      document.head.appendChild(s);
    });
  }

  // Скрипт 16: Twitch embed на странице broadcasts.html (если есть #twitch-embed).
  // Комментарий: подключаем стрим через JS (как просили).
  function initTwitchEmbed() {
    var mount = qs("#twitch-embed");
    if (!mount) return;

    var channel = mount.getAttribute("data-channel") || "eslcs";
    var parent = window.location.hostname || "localhost";

    loadScript("https://player.twitch.tv/js/embed/v1.js")
      .then(function () {
        if (!window.Twitch || !window.Twitch.Player) throw new Error("Twitch.Player not available");

        // eslint-disable-next-line no-new
        new window.Twitch.Player("twitch-embed", { 
    width: "100%", 
    height: "100%", 
    channel: channel, 
    parent: [parent] 
});
      })
      .catch(function () {
        notify({ type: "danger", title: "Broadcasts", text: "Не удалось загрузить Twitch embed (проверь интернет)." });
      });
  }

  // Скрипт 17: Реальный счётчик зрителей Twitch (без OAuth, через публичный сервис).
  // Комментарий: Helix требует токен, поэтому берём публичный viewercount как демо.
  function initTwitchViewerCounter() {
    var mount = qs("#twitch-embed");
    var out = qs(".js-twitch-viewers");
    if (!mount || !out) return;

    var channel = mount.getAttribute("data-channel") || "eslcs";
    var url = "https://decapi.me/twitch/viewercount/" + encodeURIComponent(channel);

    function tick() {
      fetch(url, { cache: "no-store" })
        .then(function (r) { return r.text(); })
        .then(function (text) {
          var n = parseInt(String(text).replace(/[^\d]/g, ""), 10);
          if (!isFinite(n)) throw new Error("bad number");
          out.textContent = n.toLocaleString("ru-RU");
        })
        .catch(function () {
          out.textContent = "—";
        });
    }

    tick();
    window.setInterval(tick, 30000);
  }

  // Скрипт 18: Виджет “напоминание” по клику на соответствующие ссылки.
  // Комментарий: добавляет интерактивность расписанию трансляций.
  function initReminders() {
    qsa("a").forEach(function (a) {
      var t = (a.textContent || "").toLowerCase();
      if (t.indexOf("напомин") === -1) return;
      a.addEventListener("click", function (e) {
        e.preventDefault();
        notify({ type: "success", title: "Напоминание", text: "Готово! Мы напомним перед эфиром (демо)." });
      });
    });
  }

  // Скрипт 19: Уведомление при простое (idle).
  // Комментарий: ещё один “виджет” — реагирует на бездействие.
  function initIdleDetector() {
    var last = Date.now();
    var shown = false;

    function bump() {
      last = Date.now();
      shown = false;
    }

    ["mousemove", "keydown", "touchstart", "scroll"].forEach(function (ev) {
      window.addEventListener(ev, bump, { passive: true });
    });

    window.setInterval(function () {
      if (shown) return;
      if (Date.now() - last > 45000) {
        shown = true;
        notify({ type: "info", title: "Эй!", text: "Ты тут? У нас ещё есть новости и стримы." });
      }
    }, 5000);
  }

  // Скрипт 20: Подсветка активного пункта меню (если aria-current забыли поставить).
  // Комментарий: подстраховка навигации.
  function initAutoCurrentNav() {
    var path = (window.location.pathname || "").split("/").pop();
    if (!path) return;
    qsa(".site-nav a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (href === path && !a.hasAttribute("aria-current")) a.setAttribute("aria-current", "page");
    });
  }

  // Скрипт 21: Стартовое сообщение о запуске.
  // Комментарий: показывает, что JS активен и язык применился.
  function initBootReport() {
    var lang = getLang();
    notify({ type: "info", title: "CyberArena", text: "Скрипты активны (" + (lang === "en" ? "EN" : "RU") + ")." });
  }

  // Скрипт 22: Мини-хранилище настроек (демо).
  // Комментарий: отдельный модуль для “количества скриптов” и примера localStorage.
  var Settings = {
    get: function (key, fallback) {
      try {
        if (!window.localStorage) return fallback;
        var raw = window.localStorage.getItem("ca_set_" + key);
        return raw == null ? fallback : safeJsonParse(raw, fallback);
      } catch (_) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        if (!window.localStorage) return;
        window.localStorage.setItem("ca_set_" + key, JSON.stringify(value));
      } catch (_) {}
    }
  };

  // Скрипт 23: Пример использования Settings (показываем приветствие 1 раз).
  // Комментарий: виджет-приветствие только при первом заходе.
  function initFirstVisitHello() {
    var seen = Settings.get("seenHello", false);
    if (seen) return;
    Settings.set("seenHello", true);
    notify({ type: "success", title: "Добро пожаловать", text: "Это демо-версия CyberArena. Пощёлкай по хедеру :) ", ttl: 6500 });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyLang(getLang());
    initMobileNav();
    initForms();
    initLangLinks();
    initConsoleEasterEgg();
    initHeaderClickEasterEgg();
    initScrollProgress();
    initBackToTop();
    initNetworkWidget();
    initHotkeys();
    initTimeOnSite();
    initTipOfTheDay();
    initAutoCurrentNav();
    initReminders();
    initIdleDetector();
    initTwitchEmbed();
    initTwitchViewerCounter();
    initFirstVisitHello();
    initBootReport();
  });
})();
