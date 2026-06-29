// ── 100Bocas CI/CD Pipeline ─────────────────────
// Builds Docker images, pushes to registry, deploys to k3s

pipeline {
    agent any

    environment {
        REGISTRY = "192.168.1.11:5000"
        K8S_OVERLAY = "k8s/overlays/production"
        BACKEND_IMAGE = "${REGISTRY}/bocas-backend"
        FRONTEND_IMAGE = "${REGISTRY}/bocas-frontend"
    }

    parameters {
        booleanParam(
            name: 'FORCE_DEPLOY',
            defaultValue: false,
            description: 'Force deploy even if same tag already exists'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Read Version') {
            steps {
                script {
                    def pkg = sh(script: "python3 -c 'import json; print(json.load(open(\"frontend/package.json\"))[\"version\"])'", returnStdout: true).trim()
                    env.APP_VERSION = pkg
                    env.GIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.IMAGE_TAG = "${env.APP_VERSION}-${env.GIT_SHORT}"
                    echo "Version: ${env.APP_VERSION} (tag: ${env.IMAGE_TAG})"
                }
            }
        }

        stage('Check Image Exists') {
            when {
                expression { return !params.FORCE_DEPLOY }
            }
            steps {
                script {
                    def skips = []
                    for (img in ['bocas-backend', 'bocas-frontend']) {
                        def manifestUrl = "${REGISTRY}/v2/${img}/manifests/${env.IMAGE_TAG}"
                        def exists = sh(
                            script: "curl -s -o /dev/null -w '%{http_code}' http://${manifestUrl}",
                            returnStdout: true
                        ).trim() == "200"
                        if (exists) {
                            echo "✓ Image ${img}:${env.IMAGE_TAG} already exists — skipping build"
                            skips << img
                        }
                    }
                    if (skips.size() == 2) {
                        env.SKIP_BUILD = 'true'
                    }
                }
            }
        }

        stage('Build Frontend') {
            when {
                expression { env.SKIP_BUILD != 'true' }
            }
            steps {
                dir('frontend') {
                    sh 'npm ci --omit=optional'
                    sh 'npx vite build --outDir ../dist/client'
                    sh 'npx vite build --ssr src/entry-server.tsx --outDir ../dist/server'
                }
            }
        }

        stage('Docker Build & Push') {
            when {
                expression { env.SKIP_BUILD != 'true' }
            }
            parallel {
                stage('Backend') {
                    steps {
                        script {
                            sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -f Dockerfile.backend ."
                            sh "docker tag ${BACKEND_IMAGE}:${IMAGE_TAG} ${BACKEND_IMAGE}:latest"
                            sh "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
                            sh "docker push ${BACKEND_IMAGE}:latest"
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        script {
                            sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -f Dockerfile.frontend ."
                            sh "docker tag ${FRONTEND_IMAGE}:${IMAGE_TAG} ${FRONTEND_IMAGE}:latest"
                            sh "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                            sh "docker push ${FRONTEND_IMAGE}:latest"
                        }
                    }
                }
            }
        }

        stage('Deploy to k3s') {
            steps {
                dir('k8s') {
                    script {
                        // Update image tags in kustomize overlay
                        sh """
                            cd overlays/production
                            kustomize edit set image PLACEHOLDER_BACKEND=${BACKEND_IMAGE}:${IMAGE_TAG}
                            kustomize edit set image PLACEHOLDER_FRONTEND=${FRONTEND_IMAGE}:${IMAGE_TAG}
                        """
                        // Apply to cluster
                        sh 'kubectl apply -k overlays/production'
                    }
                }
            }
        }

        stage('Verify Rollout') {
            steps {
                script {
                    def timeoutSeconds = 120
                    def success = true
                    for (deploy in ['bocas-backend', 'bocas-frontend', 'bocas-db']) {
                        try {
                            sh """
                                kubectl rollout status deployment/${deploy} -n bocas \
                                    --timeout=${timeoutSeconds}s
                            """
                            echo "✓ ${deploy} rollout complete"
                        } catch (err) {
                            echo "✗ ${deploy} rollout failed!"
                            success = false
                        }
                    }
                    if (!success) {
                        error "One or more deployments failed to roll out"
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker image prune -f || true'
        }
        failure {
            echo '❌ Pipeline failed — check logs'
        }
        success {
            echo '✅ 100Bocas deployed successfully'
        }
    }
}
