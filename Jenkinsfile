pipeline {
  agent any

  triggers {
    pollSCM('H/5 * * * *')
  }

  stages {
    stage('Deploy to EC2 (qa)') {
      when { branch 'qa' }
      steps {
        sshagent(credentials: ['ec2-app-deploy-key']) {
          sh '''
            ssh -o StrictHostKeyChecking=no ubuntu@18.61.245.32 '
              set -e
              cd /home/ubuntu/Realtydoor-backend
              git fetch origin
              git checkout qa
              git reset --hard origin/qa
              cd realtydoorBackend
              npm ci --omit=dev
              npx prisma generate
              pm2 restart app
              pm2 save
            '
          '''
        }
      }
    }
  }
}
