  'use strict';
  const AWS = require('aws-sdk');
  const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' }); //Aws dynomo db currrent APi version
  const { v4: uuidv4 } = require('uuid');

  const postsTable = process.env.POSTS_TABLE;
  // Create a response
  function response(statusCode, message) {
    return {
      statusCode: statusCode,
      body: JSON.stringify(message)
    };
  }
  function sortByDate(a, b) {
    if (a.createdAt > b.createdAt) {
      return -1;
    } else return 1;
  }



  //lamda function .......... 



  // Create a post
  module.exports.createUser = (event, context, callback) => {
    const reqBody = JSON.parse(event.body);

    if (
      !reqBody.title ||
      reqBody.title.trim() === '' ||
      !reqBody.body ||
      reqBody.body.trim() === ''
    ) {
      return callback(
        null,
        response(400, {
          error: 'Post must have a title and body and they must not be empty'
        })
      );
    }

    const post = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      userId: 1,
      title: reqBody.title,
      body: reqBody.body
    };

    return db
      .put({
        TableName: postsTable,
        Item: post
      })
      .promise()
      .then(() => {
        callback(null, response(201, post));
      })
      .catch((err) => response(null, response(err.statusCode, err)));
  };
  // Get all posts
  module.exports.getAllUser = (event, context, callback) => {
    return db
      .scan({
        TableName: postsTable
      })
      .promise()
      .then((res) => {
        callback(null, response(200, res.Items.sort(sortByDate)));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  };
  // Get number of posts
  module.exports.getUser = (event, context, callback) => {
    const numberOfPosts = event.pathParameters.number;
    const params = {
      TableName: postsTable,
      Limit: numberOfPosts
    };
    return db
      .scan(params)
      .promise()
      .then((res) => {
        callback(null, response(200, res.Items.sort(sortByDate)));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  };
  // Get a single post
  module.exports.getSingleUser = (event, context, callback) => {
    const id = event.pathParameters.id;

    const params = {
      Key: {
        id: id
      },
      TableName: postsTable
    };

    return db
      .get(params)
      .promise()
      .then((res) => {
        if (res.Item) callback(null, response(200, res.Item));
        else callback(null, response(404, { error: 'Post not found' }));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  };
  // Update a post
  module.exports.updateUser = (event, context, callback) => {
    const id = event.pathParameters.id;
    const reqBody = JSON.parse(event.body);
    const { body, title } = reqBody;

    const params = {
      Key: {
        id: id
      },
      TableName: postsTable,
      ConditionExpression: 'attribute_exists(id)',
      UpdateExpression: 'SET title = :title, body = :body',
      ExpressionAttributeValues: {
        ':title': title,
        ':body': body
      },
      ReturnValues: 'ALL_NEW'
    };
    console.log('Updating');

    return db
      .update(params)
      .promise()
      .then((res) => {
        console.log(res);
        callback(null, response(200, res.Attributes));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  };
  // Delete a post
  module.exports.deleteUser = (event, context, callback) => {
    const id = event.pathParameters.id;
    const params = {
      Key: {
        id: id
      },
      TableName: postsTable
    };
    return db
      .delete(params)
      .promise()
      .then(() =>
        callback(null, response(200, { message: 'Post deleted successfully' }))
      )
      .catch((err) => callback(null, response(err.statusCode, err)));
  };