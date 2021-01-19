module.exports = {
  siteMetadata: {
    title: `Nick Mantia Design`,
    author: `Nick Mantia`,
    description: `A Gatsby WordPress Starter with special love for Netlify`,
    siteUrl: `https://nickmantia.design`,
    social: {
			instagram: `nick.mantia`,
      twitter: `nick_mantia`,
    },
    postPrefix : '/project',
    pagePrefix: '',
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/project`,
				name: `project`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/assets`,
        name: `assets`,
      },
    },
    {
      resolve: 'gatsby-source-wordpress',
      options: {
        // The base url to your WP site.
				baseUrl: 'mantia.staging.wpengine.com',
        // WP.com sites set to true, WP.org set to false
        hostingWPCOM: false,
        // The protocol. This can be http or https.
        protocol: 'https',
        // Use 'Advanced Custom Fields' Wordpress plugin
        useACF: false,
        auth: {
					jwt_user: 'nmantia',
					jwt_pass: 'Pc3i4ik8',
					jwt_base_path: "/jwt-auth/v1/token",
				},
        // Set to true to debug endpoints on 'gatsby build'
        verboseOutput: true,
        excludedRoutes: [
          "/*/*/comments",
          "/yoast/**",
          "/oembed/*"
				],
				includedRoutes: [
					"**/posts",
					"**/pages",
					"**/portfolio",
					"**/media",
					"**/categories",
					"**/tags",
					"**/taxonomies",
					"**/users",
				],
        normalizer: function({ entities }) {
          return entities
        },
      }
    },
    `gatsby-transformer-sharp`,
		`gatsby-plugin-sharp`,
		`gatsby-plugin-sass`,
		'gatsby-plugin-page-load-delay',
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        //trackingId: `ADD YOUR TRACKING ID HERE`,
      },
		},
		{
			resolve: `gatsby-plugin-mdx`,
			options: {
				extensions: ['.mdx', '.md'],
			},
		},
    `gatsby-plugin-offline`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `src/utils/typography`,
      },
    },
  ],
}
