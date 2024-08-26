const PTGJson = `{
  "pages/SplashPage": [],
  "pages/MainPage": [
    [
      "ListItem",
      "onClick",
      "pages/commonDetail/DetailPage"
    ],
    [
      "__Common__",
      "onClick",
      "pages/commonDetail/DetailPage"
    ],
    [
      "ListItem",
      "onClick",
      "pages/topicDetail/TopicDetailPage"
    ],
    [
      "GridItem",
      "onClick",
      "pages/categoryDetail/CategoryDetailPage"
    ]
  ],
  "pages/container/ContainerPage": [
    [
      "ListItem",
      "onClick",
      "pages/topicDetail/TopicDetailPage"
    ],
    [
      "ListItem",
      "onClick",
      "pages/commonDetail/DetailPage"
    ],
    [
      "GridItem",
      "onClick",
      "pages/categoryDetail/CategoryDetailPage"
    ]
  ],
  "pages/commonDetail/DetailPage": [],
  "pages/topicDetail/TopicDetailPage": [],
  "pages/categoryDetail/CategoryDetailPage": [
    [
      "ListItem",
      "onClick",
      "pages/commonDetail/DetailPage"
    ]
  ],
  "pages/test/TestPage": [],
  "pages/hot/CoordinatePage": [
    [
      "ListItem",
      "onClick",
      "pages/commonDetail/DetailPage"
    ]
  ],
  "pages/test/TestHorizontalPage": [],
  "pages/test/TestHorizontalPage2": []
}`;

export default PTGJson;
