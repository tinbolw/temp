// simple-login auth attempts

// // const testCookie = await this.client.request(
//     //   {
//     //     url: `${this.baseUrl}/login.html`,
//     //     method: "POST",
//     //     body: qs.stringify({ user: 'tinbolw', pass: 'password' }),
//     //     headers: {
//     //       "Content-Type": "application/x-www-form-urlencoded",
//     //     }
//     //   }
//     // )

//     // const parsed = JSON.parse(testCookie.data);
//     // const cookie = testCookie.headers["Set-Cookie"].match(/^(.*?)\;/)[1];
//     // const cookie = testCookie.headers["Set-Cookie"].match(/=([^;]*)/)[1];
//     // console.log(cookie);

//     const client2 = new NetworkClientBuilder()
//       .addRequestInterceptor(async (req: NetworkRequest) => {
//         return {
//           ...req,
//           body: {
//             "query": GetAllMangaQuery,
//           },
//           headers: {
//             // "authorization": `Basic ${genAuthHeader(
//             //   await ObjectStore.string("suwayomi_username"), 
//             //   await ObjectStore.string("suwayomi_password")
//             // )}`,
//             // "Cookie": cookie,
//             "Content-Type": "application/json"
//           },
//           cookies: [{
//             name: "JSESSIONID",
//             value: "redacted"
//           }]
//         }
//       })
//       .build();

//     // const response = await this.client.request(
//     //   {
//     //     url: this.apiUrl,
//     //     method: "POST",
//     //     body: {
//     //       "query": GetAllMangaQuery,
//     //     },
//     //     headers: {
//     //       // "authorization": `Basic ${genAuthHeader(
//     //       //   await ObjectStore.string("suwayomi_username"), 
//     //       //   await ObjectStore.string("suwayomi_password")
//     //       // )}`,
//     //       "Cookie": cookie,
//     //       "Content-Type": "application/json"
//     //     },
//     //     // cookies: [{
//     //     //   name: "Cookie",
//     //     //   value: cookie
//     //     // }]
//     //   }
//     // )